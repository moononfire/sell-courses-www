import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes, purchaseSeriesAccess, purchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { VideoPlayer } from "@/components/video-player";

type Props = { params: Promise<{ seriesSlug: string; episodeSlug: string }> };

async function getEpisodeData(seriesSlug: string, episodeSlug: string) {
  const [s] = await db.select().from(series).where(eq(series.slug, seriesSlug)).limit(1);
  if (!s) return null;
  const [ep] = await db
    .select()
    .from(episodes)
    .where(and(eq(episodes.seriesId, s.id), eq(episodes.slug, episodeSlug)))
    .limit(1);
  if (!ep) return null;
  return { series: s, episode: ep };
}

async function hasAccess(userId: string, seriesId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: purchaseSeriesAccess.purchaseId })
    .from(purchaseSeriesAccess)
    .innerJoin(purchases, eq(purchases.id, purchaseSeriesAccess.purchaseId))
    .where(and(eq(purchases.userId, userId), eq(purchaseSeriesAccess.seriesId, seriesId)))
    .limit(1);
  return !!row;
}

export default async function WatchPage({ params }: Props) {
  const { seriesSlug, episodeSlug } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const data = await getEpisodeData(seriesSlug, episodeSlug);
  if (!data) notFound();

  const { series: s, episode: ep } = data;

  if (!ep.isPreview) {
    if (!userId) redirect(`/sign-in?callbackUrl=/watch/${seriesSlug}/${episodeSlug}`);
    const allowed = await hasAccess(userId, s.id);
    if (!allowed) redirect(`/series/${seriesSlug}`);
  }

  return (
    <>
      <Header />
      <main className="py-8 px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              <a href={`/series/${seriesSlug}`} className="hover:underline">{s.title}</a>
            </p>
            <h1 className="text-xl font-bold">{ep.title}</h1>
          </div>
          <VideoPlayer videoR2Key={ep.videoR2Key} episodeId={ep.id} />
          {ep.description && <p className="text-muted-foreground text-sm">{ep.description}</p>}
        </div>
      </main>
    </>
  );
}
