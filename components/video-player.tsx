"use client";

import { useEffect, useState } from "react";

type Props = {
  videoR2Key: string | null;
  episodeId: string;
};

export function VideoPlayer({ videoR2Key, episodeId }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoR2Key) return;
    fetch(`/api/video/signed-url?episodeId=${episodeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setSignedUrl(data.url);
        else setError("Nie udało się załadować wideo.");
      })
      .catch(() => setError("Błąd podczas ładowania wideo."));
  }, [episodeId, videoR2Key]);

  if (!videoR2Key) {
    return (
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
        Wideo niedostępne
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground animate-pulse">
        Ładowanie…
      </div>
    );
  }

  return (
    <video
      src={signedUrl}
      controls
      className="w-full aspect-video rounded-xl bg-black"
      controlsList="nodownload"
    />
  );
}
