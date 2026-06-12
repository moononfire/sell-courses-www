import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes, purchaseSeriesAccess, purchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { BuyButton } from "@/components/buy-button";

type Props = { params: Promise<{ slug: string }> };

async function getSeriesWithEpisodes(slug: string) {
  const [s] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (!s) return null;

  const eps = await db
    .select()
    .from(episodes)
    .where(eq(episodes.seriesId, s.id))
    .orderBy(episodes.position);

  return { ...s, episodes: eps };
}

async function hasAccess(userId: string | null, seriesId: string): Promise<boolean> {
  if (!userId) return false;
  const [row] = await db
    .select({ id: purchaseSeriesAccess.purchaseId })
    .from(purchaseSeriesAccess)
    .innerJoin(purchases, eq(purchases.id, purchaseSeriesAccess.purchaseId))
    .where(and(eq(purchases.userId, userId), eq(purchaseSeriesAccess.seriesId, seriesId)))
    .limit(1);
  return !!row;
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const data = await getSeriesWithEpisodes(slug);
  if (!data) notFound();

  const userHasAccess = await hasAccess(userId, data.id);
  const totalDurationMin = Math.round(
    data.episodes.reduce((sum, e) => sum + (e.durationSec ?? 0), 0) / 60
  );

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="grid gap-8 md:grid-cols-2 items-start">
            {data.thumbnailUrl ? (
              <img src={data.thumbnailUrl} alt={data.title} className="w-full rounded-xl aspect-video object-cover" />
            ) : (
              <div className="w-full rounded-xl aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                Brak miniatury
              </div>
            )}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{data.title}</h1>
              {data.description && <p className="text-muted-foreground">{data.description}</p>}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{data.episodes.length} odcinków</span>
                {totalDurationMin > 0 && <span>{totalDurationMin} min</span>}
              </div>
              {userHasAccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  Masz dostęp do tej serii
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-2xl font-bold">{formatPrice(data.priceCents)}</p>
                  <BuyButton seriesId={data.id} label={`Kup za ${formatPrice(data.priceCents)}`} />
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Lista odcinków</h2>
            <ol className="space-y-2">
              {data.episodes.map((ep) => {
                const canWatch = ep.isPreview || userHasAccess;
                return (
                  <li key={ep.id} className="rounded-lg border bg-background">
                    {canWatch ? (
                      <Link
                        href={`/watch/${slug}/${ep.slug}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-mono text-muted-foreground w-6 text-right">{ep.position}</span>
                        <span className="flex-1 text-sm font-medium">{ep.title}</span>
                        {ep.isPreview && (
                          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">Preview</span>
                        )}
                        {ep.durationSec && (
                          <span className="text-xs text-muted-foreground">{Math.round(ep.durationSec / 60)} min</span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3 opacity-60 select-none">
                        <span className="text-sm font-mono text-muted-foreground w-6 text-right">{ep.position}</span>
                        <span className="flex-1 text-sm font-medium">{ep.title}</span>
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {ep.durationSec && (
                          <span className="text-xs text-muted-foreground">{Math.round(ep.durationSec / 60)} min</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
