"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  seriesId?: string;
  bundleId?: string;
  label: string;
};

export function BuyButton({ seriesId, bundleId, label }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: seriesId ? "series" : bundleId ? "bundle" : "library",
          seriesId,
          bundleId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
    >
      {loading ? "Przekierowanie…" : label}
    </button>
  );
}
