import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json() as {
    name?: string;
    email: string;
    password: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email i hasło są wymagane" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Hasło musi mieć co najmniej 8 znaków" }, { status: 400 });
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Konto z tym emailem już istnieje" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, password: hashed, name: name ?? null });

  return NextResponse.json({ ok: true }, { status: 201 });
}
