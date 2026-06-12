import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { series, bundles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const { type, seriesId, bundleId } = await req.json() as {
    type: "library" | "series" | "bundle";
    seriesId?: string;
    bundleId?: string;
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  let name: string;
  let amountCents: number;
  const metadata: Record<string, string> = { type };
  if (userId) metadata.userId = userId;

  if (type === "series" && seriesId) {
    const [s] = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
    if (!s) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    name = s.title;
    amountCents = s.priceCents;
    metadata.seriesId = s.id;
  } else if (type === "bundle" && bundleId) {
    const [b] = await db.select().from(bundles).where(eq(bundles.id, bundleId)).limit(1);
    if (!b) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    name = b.title;
    amountCents = b.priceCents;
    metadata.bundleId = b.id;
  } else if (type === "library") {
    name = "Cała biblioteka";
    amountCents = parseInt(process.env.LIBRARY_PRICE_CENTS ?? "49900");
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "pln", product_data: { name }, unit_amount: amountCents }, quantity: 1 }],
    metadata,
    customer_creation: "always",
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel`,
  });

  return NextResponse.json({ url: stripeSession.url });
}
