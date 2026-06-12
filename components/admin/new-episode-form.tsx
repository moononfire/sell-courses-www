"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { seriesId: string };

export function NewEpisodeForm({ seriesId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      seriesId,
      title: fd.get("title"),
      slug: fd.get("slug"),
      description: fd.get("description") || null,
      position: parseInt(fd.get("position") as string),
      durationSec: fd.get("durationSec") ? parseInt(fd.get("durationSec") as string) : null,
      videoR2Key: fd.get("videoR2Key") || null,
      isPreview: fd.get("isPreview") === "on",
    };
    const res = await fetch("/api/admin/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.push(`/admin/series/${seriesId}/episodes`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: "title", label: "Tytuł", type: "text", required: true },
        { name: "slug", label: "Slug (URL)", type: "text", required: true },
        { name: "position", label: "Pozycja", type: "number", required: true },
        { name: "durationSec", label: "Czas trwania (sekundy)", type: "number", required: false },
        { name: "videoR2Key", label: "Klucz R2 (ścieżka do pliku)", type: "text", required: false },
      ].map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="text-sm font-medium" htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            required={f.required}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      ))}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="description">Opis</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isPreview" name="isPreview" className="h-4 w-4" />
        <label className="text-sm font-medium" htmlFor="isPreview">Darmowy preview</label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? "Zapisywanie…" : "Utwórz odcinek"}
      </button>
    </form>
  );
}
