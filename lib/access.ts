import { db } from "@/lib/db";
import { purchaseSeriesAccess, purchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function hasAccessToSeries(userId: string, seriesId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: purchaseSeriesAccess.purchaseId })
    .from(purchaseSeriesAccess)
    .innerJoin(purchases, eq(purchases.id, purchaseSeriesAccess.purchaseId))
    .where(and(eq(purchases.userId, userId), eq(purchaseSeriesAccess.seriesId, seriesId)))
    .limit(1);
  return !!row;
}
