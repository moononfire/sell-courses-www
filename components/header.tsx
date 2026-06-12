import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Kursy wideo
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/series" className="text-muted-foreground hover:text-foreground transition-colors">
            Kursy
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Moje kursy
              </Link>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Wyloguj
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Zaloguj się
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
