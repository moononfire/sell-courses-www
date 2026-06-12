"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isReset = searchParams.get("reset") === "1";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-destructive">Nieprawidłowy link. Skontaktuj się z nami.</p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;

    if (password !== confirm) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Błąd");
      setLoading(false);
      return;
    }

    if (data.email) {
      await signIn("credentials", { email: data.email, password, redirect: false });
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push("/sign-in?setup=1");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="password">
          {isReset ? "Nowe hasło (min. 8 znaków)" : "Hasło (min. 8 znaków)"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="confirm">Potwierdź hasło</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading
          ? "Zapisywanie…"
          : isReset ? "Zapisz nowe hasło" : "Ustaw hasło i przejdź do kursów"}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <Suspense fallback={null}>
          <SetPasswordHeader />
        </Suspense>
        <Suspense>
          <SetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

function SetPasswordHeader() {
  const searchParams = useSearchParams();
  const isReset = searchParams.get("reset") === "1";

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">{isReset ? "Nowe hasło" : "Ustaw hasło"}</h1>
      <p className="text-sm text-muted-foreground">
        {isReset
          ? "Wpisz nowe hasło do swojego konta."
          : "Konto zostało utworzone — ustaw hasło aby zalogować się."}
      </p>
    </div>
  );
}
