import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

export default async function AdminSeriesPage() {
  if (!(await isAdmin())) redirect("/");

  const allSeries = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      priceCents: series.priceCents,
      publishedAt: series.publishedAt,
      episodeCount: sql<number>`count(${episodes.id})::int`,
    })
    .from(series)
    .leftJoin(episodes, sql`${episodes.seriesId} = ${series.id}`)
    .groupBy(series.id)
    .orderBy(series.position);

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Serie</h1>
            <Link href="/admin/series/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              + Nowa seria
            </Link>
          </div>
          {allSeries.length === 0 ? (
            <p className="text-muted-foreground">Brak serii. Dodaj pierwszą.</p>
          ) : (
            <div className="rounded-xl border divide-y">
              {allSeries.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{s.title}</span>
                    <span className="text-muted-foreground ml-2">/{s.slug}</span>
                    <span className="ml-3 text-muted-foreground">{s.episodeCount} odcinków</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{(s.priceCents / 100).toFixed(2)} PLN</span>
                    {s.publishedAt ? (
                      <span className="text-xs text-green-600">opublikowana</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">szkic</span>
                    )}
                    <Link href={`/admin/series/${s.id}/episodes`} className="hover:underline text-primary">Odcinki</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
