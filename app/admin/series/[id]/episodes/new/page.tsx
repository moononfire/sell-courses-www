import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NewEpisodeForm } from "@/components/admin/new-episode-form";
import { isAdmin } from "@/lib/admin";

type Props = { params: Promise<{ id: string }> };

export default async function NewEpisodePage({ params }: Props) {
  if (!(await isAdmin())) redirect("/");
  const { id } = await params;

  const [s] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!s) notFound();

  return (
    <>
      <Header />
      <main className="py-12 px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <h1 className="text-2xl font-bold">Nowy odcinek — {s.title}</h1>
          <NewEpisodeForm seriesId={id} />
        </div>
      </main>
    </>
  );
}
