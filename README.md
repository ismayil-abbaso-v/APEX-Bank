# APEX BANK

APEX BANK müasir, tam funksional onlayn bank simulyasiyasıdır. Layihə real bank sistemlərindəki əsas əməliyyatları (hesab açılışı, kart sifarişi, daxili köçürmələr, tranzaksiya tarixçəsi, bildirişlər, AI köməkçi) tələbə layihəsi formatında nümayiş etdirir.

- **Preview:** https://apexbank.ismayil.site/

---

## İçindəkilər

1. [Layihənin Məqsədi](#1-layihənin-məqsədi)
2. [Əsas Funksiyalar](#2-əsas-funksiyalar)
3. [Texnologiya Stack-i](#3-texnologiya-stack-i)
4. [Arxitektura](#4-arxitektura)
5. [Qovluq Strukturu](#5-qovluq-strukturu)
6. [Verilənlər Bazası Sxemi](#6-verilənlər-bazası-sxemi)
7. [Təhlükəsizlik](#7-təhlükəsizlik)
8. [Lokal Quraşdırma](#8-lokal-quraşdırma)
9. [Mühit Dəyişənləri (Secrets)](#9-mühit-dəyişənləri-secrets)
10. [Deployment](#10-deployment)
11. [Çoxdilli Dəstək (i18n)](#11-çoxdilli-dəstək-i18n)
12. [Tez-tez Soruşulan Suallar](#12-tez-tez-soruşulan-suallar)

---

## 1. Layihənin Məqsədi

APEX BANK istifadəçilərə real bank təcrübəsini onlayn mühitdə yaşatmaq üçün hazırlanmışdır. Sistem:

- Təhlükəsiz qeydiyyat və giriş (Supabase Auth, JWT)
- Çoxsaylı hesab tipləri (AZN, USD, EUR)
- Debet və kredit kartı sifarişi
- Daxili köçürmələr (atomic SQL funksiyası ilə)
- Real vaxtda bildirişlər və e-poçt
- AI əsaslı müştəri köməkçisi (Lovable AI Gateway)
- Admin paneli ilə istifadəçi və hesab idarəetməsi

təklif edir.

## 2. Əsas Funksiyalar

| Modul | Təsvir |
|---|---|
| **Auth** | Qeydiyyat, giriş, parol sıfırlama (e-poçt vasitəsilə) |
| **Dashboard** | Ümumi balans, son əməliyyatlar, sürətli giriş düymələri |
| **Accounts** | Yeni hesab açılışı, IBAN avtomatik generasiyası, balans baxışı |
| **Cards** | Debet/kredit kart sifarişi, kart limitləri, dondurma |
| **Transfers** | İstifadəçilər arasında atomik köçürmə (`FOR UPDATE` lock ilə) |
| **Transactions** | Filtrlənə bilən tarixçə, CSV ixrac |
| **Notifications** | Bildirişlər + Resend ilə e-poçt göndərişi |
| **Chatbot** | Lovable AI Gateway (Gemini) ilə müştəri xidməti |
| **Admin** | Rol əsaslı (admin/user) panel, istifadəçi idarəetməsi |
| **i18n** | Azərbaycan / English / Русский dil dəstəyi |
| **Theme** | Light / Dark mode |

## 3. Texnologiya Stack-i

**Frontend**
- React 19 + TypeScript (strict)
- TanStack Start v1 (SSR + file-based routing)
- TanStack Router & TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Vite 7

**Backend / Server**
- TanStack `createServerFn` (RPC üslubu)
- Cloudflare Worker runtime (deploy)
- Supabase (PostgreSQL + Auth + RLS)
- Resend API + `pg_net` (e-poçt göndərişi)
- Lovable AI Gateway (chatbot üçün)

**Tooling**
- Bun (paket meneceri)
- ESLint + Prettier
- Vercel + Lovable (hosting)

## 4. Arxitektura

```text
┌────────────┐    HTTPS    ┌──────────────────────┐    SQL     ┌──────────────┐
│  Browser   │ ──────────► │  TanStack Start      │ ─────────► │  Supabase    │
│  (React)   │ ◄────────── │  (Cloudflare Worker) │ ◄───────── │  PostgreSQL  │
└────────────┘    JSON     └──────────┬───────────┘    RLS     └──────┬───────┘
                                      │                                │
                                      │ HTTPS                          │ pg_net
                                      ▼                                ▼
                            ┌───────────────────┐            ┌────────────────┐
                            │ Lovable AI Gateway│            │   Resend API   │
                            │   (Gemini)        │            │  (e-poçt)      │
                            └───────────────────┘            └────────────────┘
```

**Məlumat axını (köçürmə nümunəsi):**
1. İstifadəçi formanı doldurur → `useMutation` çağırılır.
2. `createServerFn` ilə server funksiyası çağırılır (JWT avtomatik əlavə olunur).
3. Middleware `requireSupabaseAuth` JWT-ni yoxlayır.
4. Server `execute_transfer_smart` SQL funksiyasını çağırır.
5. SQL `FOR UPDATE` ilə hesabı kilidləyir, balansı yoxlayır, iki UPDATE və iki INSERT edir.
6. Trigger bildiriş yaradır → `pg_net.http_post` Resend-ə göndərir.
7. Cavab UI-ya qayıdır, TanStack Query keş-i invalidate olunur.

## 5. Qovluq Strukturu

```text
src/
├── routes/                     # File-based routing (TanStack Router)
│   ├── __root.tsx              # Root layout (html, head, providers)
│   ├── index.tsx               # Landing page
│   ├── auth.tsx                # Login / Sign up
│   ├── reset-password.tsx
│   └── _authenticated/         # Auth ilə qorunan route-lar
│       ├── route.tsx           # Auth gate (redirect /auth)
│       ├── dashboard.tsx
│       ├── accounts.tsx
│       ├── cards.tsx
│       ├── transfers.tsx
│       ├── transactions.tsx
│       ├── settings.tsx
│       └── admin.tsx
├── components/
│   ├── ui/                     # shadcn/ui komponentləri
│   ├── app-shell.tsx           # Sidebar + topbar layout
│   └── chat-bot.tsx            # AI köməkçi
├── lib/
│   ├── api/                    # createServerFn faylları (*.functions.ts)
│   │   ├── admin.functions.ts
│   │   ├── chatbot.functions.ts
│   │   └── email.functions.ts
│   ├── i18n.tsx                # AZ / EN / RU lüğəti
│   ├── auth.tsx                # Auth context
│   ├── theme.tsx               # Theme provider
│   ├── useRole.ts              # Admin yoxlanışı
│   ├── secrets.server.ts       # Server-only sirrlər
│   └── ai-gateway.server.ts    # Lovable AI Gateway wrapper
├── integrations/supabase/
│   ├── client.ts               # Browser üçün publishable klient
│   ├── client.server.ts        # Server-only admin klient
│   ├── auth-middleware.ts      # requireSupabaseAuth
│   ├── auth-attacher.ts        # Global middleware
│   └── types.ts                # Auto-generated DB types
├── router.tsx                  # QueryClient + Router konfiqurasiyası
├── server.ts                   # SSR entry
├── start.ts                    # Global middleware reqs.
└── styles.css                  # Tailwind v4 + dizayn tokenləri

supabase/
├── config.toml
└── migrations/                 # SQL miqrasiyaları
```

## 6. Verilənlər Bazası Sxemi

| Cədvəl | Məqsəd |
|---|---|
| `profiles` | İstifadəçi profili (ad, soyad, telefon) |
| `user_roles` | Rollar (`admin`, `user`) — ayrı cədvəldə (privilege escalation-dan qorunma) |
| `accounts` | Bank hesabları (IBAN, valyuta, balans) |
| `cards` | Debet/kredit kartlar |
| `transactions` | Bütün maliyyə əməliyyatları |
| `beneficiaries` | Yadda saxlanmış alıcılar |
| `notifications` | İstifadəçi bildirişləri |
| `app_settings` | Tətbiq parametrləri |

Bütün cədvəllərdə **Row-Level Security (RLS)** aktivdir. Rol yoxlaması üçün `SECURITY DEFINER` `has_role(user_id, role)` funksiyası istifadə olunur.

## 7. Təhlükəsizlik

- **Parol:** Supabase Auth tərəfindən bcrypt ilə hash-lənir.
- **JWT:** HS256, `localStorage`-da saxlanılır, hər sorğuda `Authorization` header-i ilə göndərilir.
- **RLS:** Hər cədvəldə istifadəçi yalnız öz məlumatına çıxış əldə edir.
- **Race condition:** `execute_transfer_smart` funksiyası `SELECT ... FOR UPDATE` ilə hesabı kilidləyir.
- **Service role key:** YALNIZ `*.server.ts` fayllarında işlədilir, brauzerə düşmür.
- **Admin endpoint-ləri:** `requireSupabaseAuth` + `has_role(uid, 'admin')` yoxlaması ilə qorunur.
- **CORS / CSRF:** TanStack Start eyni mənbə (same-origin) RPC istifadə edir.

## 8. Lokal Quraşdırma

```bash
# 1. Asılılıqları yüklə
bun install

# 2. .env faylını hazırla (aşağıdakı bölməyə bax)
cp .env.example .env

# 3. Dev server-i işə sal
bun run dev
```

Tətbiq `http://localhost:3000` ünvanında açılır.

## 9. Mühit Dəyişənləri (Secrets)

Public dəyişənlər (`VITE_` prefiksli) brauzerə düşür, qalanlar yalnız server-də:

| Açar | Yer | Təsvir |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Admin əməliyyatları üçün |
| `LOVABLE_API_KEY` | server only | AI Gateway üçün |
| `RESEND_API_KEY` | Supabase Secrets | E-poçt göndərişi üçün |

> Production-da bütün server tərəfli açarlar **Vercel Environment Variables** + **Supabase Edge Function Secrets** bölmələrinə əlavə olunmalıdır.

## 10. Deployment

Layihə **Lovable** vasitəsilə avtomatik deploy olunur:

1. Redaktor → **Publish** düyməsi.
2. Vercel Cloudflare Worker build-i hazırlayır.
3. Supabase miqrasiyaları avtomatik tətbiq olunur.

Manual deploy üçün Vercel CLI istifadə edilə bilər:

```bash
vercel --prod
```

## 11. Çoxdilli Dəstək (i18n)

- Lüğət: `src/lib/i18n.tsx` (AZ, EN, RU).
- İstifadə:
  ```tsx
  const { t, lang, setLang } = useI18n();
  <h1>{t('landing.hero.title')}</h1>
  ```
- Dil topbar-dakı switcher-dən dəyişdirilir, seçim `localStorage`-da saxlanılır.

## 12. Tez-tez Soruşulan Suallar

**S: Niyə `react-router-dom` yox, TanStack Router?**
C: Tam type-safe routing, SSR dəstəyi və loader-lər üçün.

**S: Resend test domeni niyə yalnız bir e-poçta göndərir?**
C: `onboarding@resend.dev` test domenidir və yalnız hesab sahibinin e-poçtuna icazə verir. Bütün istifadəçilərə göndərmək üçün öz domeni Resend-də verifikasiya etmək lazımdır.

**S: Niyə service role key brauzerdə yoxdur?**
C: Service role RLS-i bypass edir — brauzerə düşsə tam DB-yə icazə açılar. Yalnız `.server.ts` fayllarında istifadə olunur.

**S: Köçürmə zamanı eyni anda iki sorğu gəlsə nə olur?**
C: `SELECT ... FOR UPDATE` row-level lock yaradır, ikinci sorğu birincinin commit-ini gözləyir — double-spend mümkün deyil.

---

© 2026 APEX BANK — Akademik tələbə layihəsi.
