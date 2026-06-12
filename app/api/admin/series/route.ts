import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    title: string;
    slug: string;
    description?: string;
    priceCents: number;
    thumbnailUrl?: string | null;
  };

  const [created] = await db.insert(series).values({
    title: body.title,
    slug: body.slug,
    description: body.description ?? null,
    priceCents: body.priceCents,
    thumbnailUrl: body.thumbnailUrl ?? null,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
