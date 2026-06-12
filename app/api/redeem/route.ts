import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redeemCodes, purchases, purchaseSeriesAccess, bundleSeries, series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Musisz być zalogowany" }, { status: 401 });
  }

  const { code } = await req.json() as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Brak kodu" }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase();

  const [row] = await db
    .select()
    .from(redeemCodes)
    .where(eq(redeemCodes.code, normalized))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Nieprawidłowy kod" }, { status: 404 });
  }
  if (row.redeemedAt) {
    return NextResponse.json({ error: "Kod został już wykorzystany" }, { status: 409 });
  }
  if (row.expiresAt < new Date()) {
    return NextResponse.json({ error: "Kod wygasł" }, { status: 410 });
  }

  const purchaseId = crypto.randomUUID();
  await db.insert(purchases).values({
    id: purchaseId,
    userId: session.user.id,
    type: row.type,
    seriesId: row.seriesId,
    bundleId: row.bundleId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    amountCents: row.amountCents,
  });

  if (row.type === "series" && row.seriesId) {
    await db.insert(purchaseSeriesAccess).values({ purchaseId, seriesId: row.seriesId });
  } else if (row.type === "bundle" && row.bundleId) {
    const rows = await db
      .select({ seriesId: bundleSeries.seriesId })
      .from(bundleSeries)
      .where(eq(bundleSeries.bundleId, row.bundleId));
    if (rows.length) {
      await db.insert(purchaseSeriesAccess).values(rows.map((r) => ({ purchaseId, seriesId: r.seriesId })));
    }
  } else if (row.type === "library") {
    const allSeries = await db.select({ id: series.id }).from(series);
    if (allSeries.length) {
      await db.insert(purchaseSeriesAccess).values(allSeries.map((s) => ({ purchaseId, seriesId: s.id })));
    }
  }

  await db
    .update(redeemCodes)
    .set({ redeemedByUserId: session.user.id, redeemedAt: new Date() })
    .where(eq(redeemCodes.code, normalized));

  return NextResponse.json({ ok: true });
}
