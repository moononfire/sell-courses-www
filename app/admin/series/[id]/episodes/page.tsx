import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEpisodesPage({ params }: Props) {
  if (!(await isAdmin())) redirect("/");
  const { id } = await params;

  const [s] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!s) notFound();

  const eps = await db.select().from(episodes).where(eq(episodes.seriesId, id)).orderBy(episodes.position);

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/series" className="text-sm text-muted-foreground hover:underline">← Serie</Link>
              <h1 className="text-2xl font-bold mt-1">{s.title} — Odcinki</h1>
            </div>
            <Link href={`/admin/series/${id}/episodes/new`} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              + Nowy odcinek
            </Link>
          </div>
          {eps.length === 0 ? (
            <p className="text-muted-foreground">Brak odcinków. Dodaj pierwszy.</p>
          ) : (
            <div className="rounded-xl border divide-y">
              {eps.map((ep) => (
                <div key={ep.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground w-6 text-right">{ep.position}</span>
                    <span className="font-medium">{ep.title}</span>
                    {ep.isPreview && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">Preview</span>}
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {ep.durationSec && <span>{Math.round(ep.durationSec / 60)} min</span>}
                    {ep.videoR2Key ? <span className="text-green-600 text-xs">wideo OK</span> : <span className="text-xs">brak wideo</span>}
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
