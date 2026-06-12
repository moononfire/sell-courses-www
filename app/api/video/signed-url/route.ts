import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { episodes, purchaseSeriesAccess, purchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const episodeId = req.nextUrl.searchParams.get("episodeId");

  if (!episodeId) return NextResponse.json({ error: "Missing episodeId" }, { status: 400 });

  const [ep] = await db.select().from(episodes).where(eq(episodes.id, episodeId)).limit(1);
  if (!ep || !ep.videoR2Key) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  if (!ep.isPreview) {
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [row] = await db
      .select({ id: purchaseSeriesAccess.purchaseId })
      .from(purchaseSeriesAccess)
      .innerJoin(purchases, eq(purchases.id, purchaseSeriesAccess.purchaseId))
      .where(and(eq(purchases.userId, userId), eq(purchaseSeriesAccess.seriesId, ep.seriesId)))
      .limit(1);
    if (!row) return NextResponse.json({ error: "No access" }, { status: 403 });
  }

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: ep.videoR2Key }),
    { expiresIn: 7200 }
  );

  return NextResponse.json({ url });
}
