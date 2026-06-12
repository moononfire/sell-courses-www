import Link from "next/link";
import { Header } from "@/components/header";

export default function CheckoutCancelPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Płatność anulowana</h1>
          <p className="text-muted-foreground">
            Płatność została anulowana. Nic nie zostało pobrane z Twojego konta.
          </p>
          <Link
            href="/series"
            className="inline-block rounded-lg border px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            Wróć do kursów
          </Link>
        </div>
      </main>
    </>
  );
}
