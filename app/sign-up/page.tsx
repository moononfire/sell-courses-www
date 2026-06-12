"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Błąd rejestracji");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });
    if (signInResult?.error) {
      setError("Konto utworzone, ale logowanie się nie powiodło. Zaloguj się ręcznie.");
      setLoading(false);
      return;
    }

    if (code) {
      const redeemRes = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!redeemRes.ok) {
        const redeemData = await redeemRes.json();
        setError(redeemData.error ?? "Nie udało się aktywować kodu. Spróbuj wpisać go ręcznie w panelu.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Utwórz konto</h1>
          {code ? (
            <p className="text-sm text-muted-foreground">
              Masz kod dostępu do kursu — po rejestracji zostanie aktywowany automatycznie.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Bezpłatna rejestracja</p>
          )}
        </div>
        {code && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <span className="font-medium">Kod dostępu:</span>{" "}
            <span className="font-mono tracking-widest">{code}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">Imię (opcjonalnie)</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">Hasło (min. 8 znaków)</label>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading
              ? code ? "Tworzenie konta i aktywacja…" : "Tworzenie konta…"
              : code ? "Utwórz konto i aktywuj dostęp" : "Utwórz konto"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
