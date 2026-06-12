import Link from "next/link";
import { Header } from "@/components/header";

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900 dark:text-green-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Zakup zakończony!</h1>
          <p className="text-muted-foreground">
            Dziękujemy za zakup. Dostęp do kursów jest już aktywny.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Przejdź do moich kursów
          </Link>
        </div>
      </main>
    </>
  );
}
