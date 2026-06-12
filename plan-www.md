# Plan: Platforma kursów wideo

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Język | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Baza danych | Neon (PostgreSQL) + Drizzle ORM |
| Auth | Clerk (darmowy do 10k MAU) |
| Video hosting | Cloudflare R2 + signed URLs + Video.js (darmowe do startu) |
| Płatności | Stripe (one-time: odcinek / seria / bundle / cała biblioteka) |
| Email | Resend |
| Hosting | Vercel |
| CI/CD | GitHub Actions + Vercel |

## Model biznesowy

- Zakup **całej biblioteki** (dostęp do wszystkiego, jednorazowo)
- Zakup **jednej serii** (dostęp do wszystkich odcinków serii)
- **Bundle** — wybierz N serii z puli (np. 3 z 10), cena niższa niż osobno
- Każda seria: kilka odcinków po 30–60 minut
- Pierwszy odcinek każdej serii dostępny jako **darmowy preview**

## Schemat bazy danych (Drizzle)

Tabele:
- `users` — id (Clerk user_id), email, created_at
- `series` — id, slug, title, description, thumbnail_url, price_cents, position, published_at
- `episodes` — id, series_id, slug, title, description, duration_sec, video_r2_key, position, is_preview, published_at
- `bundles` — id, slug, title, description, price_cents, series_count (ile serii wchodzi)
- `bundle_series` — bundle_id, series_id (które serie wchodzą do bundle)
- `purchases` — id, user_id, type (library|series|bundle), series_id (nullable), bundle_id (nullable), stripe_payment_intent_id, amount_cents, created_at
- `purchase_series_access` — purchase_id, series_id (rozwinięcie bundle na konkretne serie)

## Kroki implementacji

### Krok 1 — Podmiana Supabase na Neon + Drizzle

- [ ] Dodać paczki: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`
- [ ] Usunąć paczki Supabase: `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Napisać schema Drizzle w `lib/db/schema.ts`
- [ ] Napisać klienta Neon w `lib/db/index.ts`
- [ ] Napisać pierwszą migrację SQL (`drizzle/migrations/`)
- [ ] Skonfigurować `drizzle.config.ts`
- [ ] Usunąć `lib/supabase/`, `types/supabase.ts`, `supabase/` folder
- [ ] Zaktualizować `.env.example` (usunąć SUPABASE_*, dodać `DATABASE_URL`)
- [ ] Zaktualizować `middleware.ts` (wyczyścić Supabase middleware)
- [ ] Zaktualizować skrypty w `package.json` (`db:migrate`, `db:studio`)

### Krok 2 — Integracja Clerk

- [ ] Dodać paczkę `@clerk/nextjs`
- [ ] Owinąć `app/layout.tsx` w `<ClerkProvider>`
- [ ] Skonfigurować `middleware.ts` — chronić `/dashboard/*`, `/watch/*`, `/api/purchases/*`
- [ ] Dodać strony auth: `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`
- [ ] Dodać komponent nagłówka z `<UserButton>` i `<SignInButton>`
- [ ] Dodać `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` do `.env.example`
- [ ] Webhook Clerk → zapisywanie nowego usera do tabeli `users` w Neon (`app/api/webhooks/clerk/route.ts`)

### Krok 3 — Strona główna (wizytówka + katalog)

- [ ] `app/page.tsx` — hero section z opisem platformy
- [ ] Sekcja "Nasze serie" — karty serii z miniaturą, tytułem, ceną, liczba odcinków
- [ ] Sekcja "Jak to działa" — 3 kroki: przeglądaj → kup → oglądaj
- [ ] Sekcja "O autorze" — bio, zdjęcie
- [ ] Footer z linkami
- [ ] `app/series/page.tsx` — pełna lista wszystkich serii

### Krok 4 — Strona serii i odcinku

- [ ] `app/series/[slug]/page.tsx` — opis serii, lista odcinków, cena, przycisk kup
- [ ] Pierwszy odcinek każdej serii: wyświetlany bez logowania jako preview
- [ ] Pozostałe odcinki: jeśli user nie ma dostępu → blur/lock z CTA "Kup dostęp"
- [ ] `app/watch/[seriesSlug]/[episodeSlug]/page.tsx` — player wideo (wymaga dostępu)
- [ ] Sprawdzanie dostępu: query do `purchase_series_access` po user_id + series_id

### Krok 5 — Player wideo + Cloudflare R2

- [ ] Konto Cloudflare, bucket R2 `courses-videos`
- [ ] Dodać `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (R2 kompatybilny z S3 SDK)
- [ ] `app/api/video/signed-url/route.ts` — generuje signed URL (ważny 2h), sprawdza dostęp
- [ ] Komponent `<VideoPlayer>` z Video.js (lub natywny `<video>`) pobierający signed URL
- [ ] Dodać env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- [ ] Skrypt do uploadu wideo: `scripts/upload-video.ts` (CLI do wgrywania odcinków)

### Krok 6 — Płatności Stripe

- [ ] Produkty w Stripe: `library_access`, `series_{slug}`, `bundle_{slug}`
- [ ] `app/api/checkout/route.ts` — tworzy Stripe Checkout Session (POST z type + id)
- [ ] Zaktualizować `app/api/webhooks/stripe/route.ts`:
  - `checkout.session.completed` → zapisz rekord w `purchases` + `purchase_series_access`
  - Dla bundle: rozwiń na konkretne serie i zapisz każdą w `purchase_series_access`
- [ ] Strona sukcesu: `app/checkout/success/page.tsx`
- [ ] Strona błędu: `app/checkout/cancel/page.tsx`
- [ ] Funkcja pomocnicza `lib/access.ts` — `hasAccessToSeries(userId, seriesId): boolean`

### Krok 7 — Dashboard użytkownika

- [ ] `app/dashboard/page.tsx` — lista zakupionych serii/bundle
- [ ] Dla każdej serii: lista odcinków z linkami do oglądania
- [ ] Historia zakupów z datą i kwotą

### Krok 8 — Panel admina

- [ ] Chronić `/admin/*` — tylko dla hardcoded admin email lub rola w Clerk
- [ ] `app/admin/page.tsx` — przegląd: liczba userów, przychodów, sprzedanych serii
- [ ] `app/admin/series/page.tsx` — lista serii, dodaj/edytuj
- [ ] `app/admin/series/new/page.tsx` — formularz nowej serii (tytuł, opis, cena, thumbnail)
- [ ] `app/admin/series/[id]/episodes/page.tsx` — lista odcinków serii
- [ ] `app/admin/series/[id]/episodes/new/page.tsx` — formularz nowego odcinka (tytuł, opis, klucz R2, pozycja, czy preview)

### Krok 9 — Email po zakupie

- [ ] Zaktualizować `lib/resend/emails/` — szablon emaila potwierdzającego zakup
- [ ] Wysyłać po `checkout.session.completed` z linkiem do dashboard

### Krok 10 — Deploy i konfiguracja produkcyjna

- [ ] Ustawić wszystkie env vars w Vercel
- [ ] Podłączyć domenę
- [ ] Ustawić webhook Stripe na produkcyjny URL
- [ ] Ustawić webhook Clerk na produkcyjny URL
- [ ] Ustawić CORS na bucket R2 (tylko własna domena)
- [ ] Test end-to-end: rejestracja → zakup → oglądanie

## Zmienne środowiskowe (finalne)

```
# Neon
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# App
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL=
```
