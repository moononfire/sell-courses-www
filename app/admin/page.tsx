import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { users, purchases } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

async function getStats() {
  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)::int` }).from(users);
  const [{ revenue }] = await db.select({ revenue: sql<number>`coalesce(sum(amount_cents), 0)::int` }).from(purchases);
  const [{ purchaseCount }] = await db.select({ purchaseCount: sql<number>`count(*)::int` }).from(purchases);
  return { userCount, revenue, purchaseCount };
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/");

  const stats = await getStats();

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <h1 className="text-2xl font-bold">Panel admina</h1>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Użytkownicy", value: stats.userCount },
              { label: "Zakupy", value: stats.purchaseCount },
              { label: "Przychód", value: `${(stats.revenue / 100).toFixed(2)} PLN` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-background p-5">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/series" className="inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Serie i odcinki →
          </Link>
        </div>
      </main>
    </>
  );
}
