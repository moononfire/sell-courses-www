import Link from "next/link";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series, episodes } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

async function getSeriesWithEpisodeCount() {
  try {
    const rows = await db
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
    return rows;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const allSeries = await getSeriesWithEpisodeCount();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-background py-24 px-6">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Naucz się programowania<br />
              <span className="text-primary">bez zbędnego bałaganu</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Praktyczne kursy wideo — kup jedną serię, bundle lub całą bibliotekę.
              Bez subskrypcji, bez limitów czasowych.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/series"
                className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Przeglądaj kursy
              </Link>
              <Link
                href="#jak-to-dziala"
                className="rounded-lg border px-6 py-3 text-base font-semibold hover:bg-muted transition-colors"
              >
                Jak to działa?
              </Link>
            </div>
          </div>
        </section>

        {/* Series catalog */}
        {allSeries.length > 0 && (
          <section className="py-16 px-6 bg-muted/30">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold mb-8">Nasze serie</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allSeries.map((s) => (
                  <Link key={s.id} href={`/series/${s.slug}`} className="group rounded-xl border bg-background overflow-hidden hover:shadow-md transition-shadow">
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
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{s.title}</h3>
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
              <div className="mt-8 text-center">
                <Link href="/series" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                  Zobacz wszystkie serie →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section id="jak-to-dziala" className="py-16 px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-10 text-center">Jak to działa?</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Przeglądaj",
                  desc: "Obejrzyj darmowy pierwszy odcinek każdej serii. Oceń, czy to dla Ciebie.",
                },
                {
                  step: "2",
                  title: "Kup",
                  desc: "Wybierz jedną serię, bundle kilku serii lub całą bibliotekę. Jednorazowa płatność.",
                },
                {
                  step: "3",
                  title: "Oglądaj",
                  desc: "Natychmiastowy dostęp do zakupionych treści. Na zawsze, w swoim tempie.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <h2 className="text-2xl font-bold">O autorze</h2>
            <p className="text-muted-foreground">
              Tworzę praktyczne kursy programowania skupione na rzeczach, które naprawdę mają znaczenie w codziennej pracy.
              Bez lania wody, bez akademickiego podejścia — tylko konkretna wiedza, którą możesz zastosować od razu.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-8 px-6 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Kursy wideo</span>
          <div className="flex gap-6">
            <Link href="/series" className="hover:text-foreground transition-colors">Kursy</Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Logowanie</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
