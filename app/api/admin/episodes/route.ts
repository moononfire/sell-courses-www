import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { episodes } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    seriesId: string;
    title: string;
    slug: string;
    description?: string | null;
    position: number;
    durationSec?: number | null;
    videoR2Key?: string | null;
    isPreview: boolean;
  };

  const [created] = await db.insert(episodes).values({
    seriesId: body.seriesId,
    title: body.title,
    slug: body.slug,
    description: body.description ?? null,
    position: body.position,
    durationSec: body.durationSec ?? null,
    videoR2Key: body.videoR2Key ?? null,
    isPreview: body.isPreview,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
