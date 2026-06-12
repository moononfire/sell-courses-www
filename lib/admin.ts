import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return user?.email === process.env.ADMIN_EMAIL;
}

export async function requireAdmin() {
  const ok = await isAdmin();
  if (!ok) throw new Error("Forbidden");
}
