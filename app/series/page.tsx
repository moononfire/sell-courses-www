import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Wszystkie kursy",
};

async function getAllSeries() {
  try {
    return await db
      .select({
        id: series.id,
        slug: series.slug,
        title: series.title,
        description: series.description,
        thumbnailUrl: series.thumbnailUrl,
        priceCents: series.priceCents,
        episodeCount: sql<number>`count(${episodes.id})::int`,
      })
      .from(series)
      .leftJoin(episodes, sql`${episodes.seriesId} = ${series.id}`)
      .where(sql`${series.publishedAt} is not null`)
      .groupBy(series.id)
      .orderBy(series.position);
  } catch {
    return [];
  }
}

export default async function SeriesPage() {
  const allSeries = await getAllSeries();

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Wszystkie serie</h1>
          {allSeries.length === 0 ? (
            <p className="text-muted-foreground">Wkrótce pojawią się pierwsze kursy.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allSeries.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.slug}`}
                  className="group rounded-xl border bg-background overflow-hidden hover:shadow-md transition-shadow"
                >
                  {s.thumbnailUrl ? (
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      Brak miniatury
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h2 className="font-semibold group-hover:text-primary transition-colors">{s.title}</h2>
                    {s.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm pt-1">
                      <span className="text-muted-foreground">{s.episodeCount} odcinków</span>
                      <span className="font-semibold">{formatPrice(s.priceCents)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
