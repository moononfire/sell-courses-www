import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { purchases, purchaseSeriesAccess, series, episodes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Moje kursy" };

async function getUserPurchases(userId: string) {
  return db
    .select({
      purchaseId: purchases.id,
      type: purchases.type,
      amountCents: purchases.amountCents,
      createdAt: purchases.createdAt,
      seriesId: purchaseSeriesAccess.seriesId,
      seriesTitle: series.title,
      seriesSlug: series.slug,
      episodeCount: sql<number>`count(${episodes.id})::int`,
    })
    .from(purchases)
    .innerJoin(purchaseSeriesAccess, eq(purchaseSeriesAccess.purchaseId, purchases.id))
    .innerJoin(series, eq(series.id, purchaseSeriesAccess.seriesId))
    .leftJoin(episodes, sql`${episodes.seriesId} = ${series.id}`)
    .where(eq(purchases.userId, userId))
    .groupBy(purchases.id, purchaseSeriesAccess.seriesId, series.id)
    .orderBy(purchases.createdAt);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const rows = await getUserPurchases(session.user.id);

  const seriesMap = new Map<string, { title: string; slug: string; episodeCount: number }>();
  for (const r of rows) {
    if (r.seriesId && !seriesMap.has(r.seriesId)) {
      seriesMap.set(r.seriesId, { title: r.seriesTitle ?? "", slug: r.seriesSlug ?? "", episodeCount: r.episodeCount });
    }
  }

  const purchaseHistory = rows.reduce<Map<string, { amountCents: number; createdAt: Date; type: string }>>(
    (acc, r) => {
      if (!acc.has(r.purchaseId)) {
        acc.set(r.purchaseId, { amountCents: r.amountCents, createdAt: r.createdAt, type: r.type });
      }
      return acc;
    },
    new Map()
  );

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <h1 className="text-2xl font-bold">Moje kursy</h1>

          {seriesMap.size === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
              <p className="text-muted-foreground">Nie masz jeszcze żadnych kursów.</p>
              <Link href="/series" className="text-sm text-primary hover:underline">
                Przeglądaj kursy →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from(seriesMap.entries()).map(([id, s]) => (
                <Link key={id} href={`/series/${s.slug}`} className="rounded-xl border bg-background p-4 hover:shadow-md transition-shadow space-y-1">
                  <h2 className="font-semibold">{s.title}</h2>
                  <p className="text-sm text-muted-foreground">{s.episodeCount} odcinków</p>
                </Link>
              ))}
            </div>
          )}

          {purchaseHistory.size > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Historia zakupów</h2>
              <div className="rounded-xl border divide-y">
                {Array.from(purchaseHistory.entries()).map(([id, p]) => (
                  <div key={id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium capitalize">{p.type}</span>
                      <span className="text-muted-foreground ml-2">{new Date(p.createdAt).toLocaleDateString("pl-PL")}</span>
                    </div>
                    <span className="font-semibold">{formatPrice(p.amountCents)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
