import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { purchases, purchaseSeriesAccess, bundleSeries, series, users, redeemCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPurchaseConfirmationEmail, sendRedeemCodeEmail } from "@/lib/resend/send";

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

      const amountCents = session.amount_total ?? 0;
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      const productName = type === "series" && meta.seriesId
        ? (await db.select({ title: series.title }).from(series).where(eq(series.id, meta.seriesId)).limit(1))[0]?.title ?? "kurs"
        : type === "library" ? "cała biblioteka" : "pakiet";

      const buyerEmail = session.customer_details?.email;

      // Logged-in user — assign purchase directly
      if (meta.userId) {
        const purchaseId = crypto.randomUUID();
        await db.insert(purchases).values({
          id: purchaseId,
          userId: meta.userId,
          type,
          seriesId: meta.seriesId ?? null,
          bundleId: meta.bundleId ?? null,
          stripePaymentIntentId: paymentIntentId,
          amountCents,
        });
        await insertPurchaseAccess(purchaseId, type, meta);

        if (buyerEmail) {
          await sendPurchaseConfirmationEmail({ to: buyerEmail, productName, signInRequired: false });
        }
        return NextResponse.json({ received: true });
      }

      // Guest with existing account — assign to existing user
      if (buyerEmail) {
        const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, buyerEmail)).limit(1);
        if (existing) {
          const purchaseId = crypto.randomUUID();
          await db.insert(purchases).values({
            id: purchaseId,
            userId: existing.id,
            type,
            seriesId: meta.seriesId ?? null,
            bundleId: meta.bundleId ?? null,
            stripePaymentIntentId: paymentIntentId,
            amountCents,
          });
          await insertPurchaseAccess(purchaseId, type, meta);

          await sendPurchaseConfirmationEmail({ to: buyerEmail, productName, signInRequired: true });
          return NextResponse.json({ received: true });
        }
      }

      // Guest without account — create redeem code
      if (!buyerEmail) {
        console.error("No userId in metadata and no email from Stripe", session.id);
        return NextResponse.json({ received: true });
      }

      const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
      const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

      await db.insert(redeemCodes).values({
        code,
        email: buyerEmail,
        type,
        seriesId: meta.seriesId ?? null,
        bundleId: meta.bundleId ?? null,
        stripePaymentIntentId: paymentIntentId,
        amountCents,
        expiresAt,
      });

      await sendRedeemCodeEmail({ to: buyerEmail, code, productName });
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function insertPurchaseAccess(
  purchaseId: string,
  type: "library" | "series" | "bundle",
  meta: Record<string, string>
) {
  if (type === "series" && meta.seriesId) {
    await db.insert(purchaseSeriesAccess).values({ purchaseId, seriesId: meta.seriesId });
  } else if (type === "bundle" && meta.bundleId) {
    const rows = await db
      .select({ seriesId: bundleSeries.seriesId })
      .from(bundleSeries)
      .where(eq(bundleSeries.bundleId, meta.bundleId));
    if (rows.length) {
      await db.insert(purchaseSeriesAccess).values(rows.map((r) => ({ purchaseId, seriesId: r.seriesId })));
    }
  } else if (type === "library") {
    const allSeries = await db.select({ id: series.id }).from(series);
    if (allSeries.length) {
      await db.insert(purchaseSeriesAccess).values(allSeries.map((s) => ({ purchaseId, seriesId: s.id })));
    }
  }
}
