import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json() as { token: string; password: string };

  if (!token || !password) {
    return NextResponse.json({ error: "Brak tokenu lub hasła" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Hasło musi mieć co najmniej 8 znaków" }, { status: 400 });
  }

  const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);

  if (!row) {
    return NextResponse.json({ error: "Nieprawidłowy lub wygasły link" }, { status: 400 });
  }
  if (row.expiresAt < new Date()) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return NextResponse.json({ error: "Link wygasł — skontaktuj się z nami" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.update(users).set({ password: hashed }).where(eq(users.id, row.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return NextResponse.json({ ok: true });
}
