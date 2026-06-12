import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { purchases, purchaseSeriesAccess, bundleSeries, series, users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSetPasswordEmail, sendPurchaseConfirmationEmail } from "@/lib/resend/send";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      const type = meta.type as "library" | "series" | "bundle";

      if (!type) {
        console.error("Missing type in metadata", meta);
        return NextResponse.json({ received: true });
      }

      // Resolve userId — from metadata (logged-in) or find/create by email (guest)
      let userId = meta.userId ?? null;
      let isNewUser = false;

      if (!userId) {
        const email = session.customer_details?.email;
        if (!email) {
          console.error("No userId in metadata and no email from Stripe", session.id);
          return NextResponse.json({ received: true });
        }

        const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (existing) {
          userId = existing.id;
        } else {
          const newId = crypto.randomUUID();
          await db.insert(users).values({ id: newId, email, name: session.customer_details?.name ?? null });
          userId = newId;
          isNewUser = true;
        }
      }

      const amountCents = session.amount_total ?? 0;
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      const purchaseId = crypto.randomUUID();

      await db.insert(purchases).values({
        id: purchaseId,
        userId,
        type,
        seriesId: meta.seriesId ?? null,
        bundleId: meta.bundleId ?? null,
        stripePaymentIntentId: paymentIntentId,
        amountCents,
      });

      if (type === "series" && meta.seriesId) {
        await db.insert(purchaseSeriesAccess).values({ purchaseId, seriesId: meta.seriesId });
      } else if (type === "bundle" && meta.bundleId) {
        const rows = await db
          .select({ seriesId: bundleSeries.seriesId })
          .from(bundleSeries)
          .where(eq(bundleSeries.bundleId, meta.bundleId));

        if (rows.length) {
          await db.insert(purchaseSeriesAccess).values(
            rows.map((r) => ({ purchaseId, seriesId: r.seriesId }))
          );
        }
      } else if (type === "library") {
        const allSeries = await db.select({ id: series.id }).from(series);
        if (allSeries.length) {
          await db.insert(purchaseSeriesAccess).values(
            allSeries.map((s) => ({ purchaseId, seriesId: s.id }))
          );
        }
      }

      const productName = type === "series" && meta.seriesId
        ? (await db.select({ title: series.title }).from(series).where(eq(series.id, meta.seriesId)).limit(1))[0]?.title ?? "kurs"
        : type === "library" ? "cała biblioteka" : "pakiet";

      const buyerEmail = session.customer_details?.email;

      if (isNewUser && buyerEmail) {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.insert(passwordResetTokens).values({ token, userId, expiresAt });

        await sendSetPasswordEmail({
          to: buyerEmail,
          token,
          productName,
        });
      } else if (buyerEmail) {
        await sendPurchaseConfirmationEmail({
          to: buyerEmail,
          productName,
        });
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
