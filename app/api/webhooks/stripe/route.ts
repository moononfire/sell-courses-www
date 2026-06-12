import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { purchases, purchaseSeriesAccess, bundleSeries, series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
      const userId = meta.userId;
      const type = meta.type as "library" | "series" | "bundle";

      if (!userId || !type) {
        console.error("Missing metadata", meta);
        return NextResponse.json({ received: true });
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
        await db.insert(purchaseSeriesAccess).values({
          purchaseId,
          seriesId: meta.seriesId,
        });
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
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
