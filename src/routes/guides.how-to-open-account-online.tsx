import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, ShieldCheck, Smartphone, Wallet, ArrowRight } from "lucide-react";
import logoUrl from "@/assets/atu-logo.png";

const CANONICAL = "https://apexbank-az.lovable.app/guides/how-to-open-account-online";

export const Route = createFileRoute("/guides/how-to-open-account-online")({
  head: () => ({
    meta: [
      { title: "How to Open a Bank Account Online in 2 Minutes — APEX BANK" },
      {
        name: "description",
        content:
          "Step-by-step guide to opening a bank account online with APEX BANK. Learn the requirements, the 4-step process, and why you can skip the branch visit entirely.",
      },
      { property: "og:title", content: "How to Open a Bank Account Online — APEX BANK Guide" },
      {
        property: "og:description",
        content:
          "Yes, you can open a bank account online. Here is exactly what you need and how to do it in about 2 minutes with APEX BANK.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "How to Open a Bank Account Online — APEX BANK Guide" },
      {
        name: "twitter:description",
        content: "The complete guide to opening a bank account online in 2 minutes.",
      },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to open a bank account online with APEX BANK",
          description:
            "Open a fully functional multi-currency bank account online in about 2 minutes — no branch visit required.",
          totalTime: "PT2M",
          step: [
            { "@type": "HowToStep", position: 1, name: "Create your APEX BANK profile", text: "Sign up with your email and a secure password on the APEX BANK sign-up page." },
            { "@type": "HowToStep", position: 2, name: "Verify your identity", text: "Enter your full name and phone number. Identity is verified through our secure Supabase-backed authentication." },
            { "@type": "HowToStep", position: 3, name: "Choose account type and currency", text: "Pick a current or savings account in AZN, USD or EUR. Your IBAN is generated automatically." },
            { "@type": "HowToStep", position: 4, name: "Order a card and start banking", text: "Order a debit or credit card, then send transfers, view transactions and manage everything from your dashboard." },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Can I open a bank account online?", acceptedAnswer: { "@type": "Answer", text: "Yes. With APEX BANK you can open a full multi-currency account online in about 2 minutes without visiting a branch." } },
            { "@type": "Question", name: "What do I need to open a bank account online?", acceptedAnswer: { "@type": "Answer", text: "You need an email address, a phone number, your full legal name and a secure password. No paperwork or branch visit is required." } },
            { "@type": "Question", name: "How long does it take to open an APEX BANK account?", acceptedAnswer: { "@type": "Answer", text: "About two minutes from sign-up to a funded, ready-to-use account with an IBAN." } },
            { "@type": "Question", name: "Is it safe to open a bank account online?", acceptedAnswer: { "@type": "Answer", text: "Yes. APEX BANK uses bcrypt password hashing, JWT-based sessions, row-level security on every table, and atomic SQL transactions to keep your money and data safe." } },
            { "@type": "Question", name: "Is opening an account free?", acceptedAnswer: { "@type": "Answer", text: "Opening an account is completely free. Savings accounts have no monthly fee; current accounts have a 1 AZN monthly maintenance fee." } },
          ],
        }),
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 sticky top-0 z-40 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4 md:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
            <img src={logoUrl} alt="APEX BANK logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg">APEX BANK</span>
        </Link>
        <Link to="/auth">
          <Button size="sm">Open account</Button>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span>Guides</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Open an account online</span>
        </nav>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How to Open a Bank Account Online in 2 Minutes
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Yes — you can open a bank account online, and you no longer need to visit a branch,
            book an appointment, or hand over a stack of paperwork. This guide walks you through
            exactly what you need and the four steps to a fully working APEX BANK account.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 not-prose mb-10">
            <Card className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">~2 minutes</div>
                <div className="text-xs text-muted-foreground">End-to-end signup</div>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">No branch visit</div>
                <div className="text-xs text-muted-foreground">100% online</div>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">Bank-grade security</div>
                <div className="text-xs text-muted-foreground">JWT + RLS + bcrypt</div>
              </div>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-3">Can I really open a bank account online?</h2>
          <p>
            Yes. Digital-first banks like APEX BANK let you open a fully functional account from
            your phone or laptop, without ever visiting a physical branch. Your identity is
            verified electronically, your IBAN is generated automatically, and you can start
            sending and receiving money the moment your account is created.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-3">What you need before you start</h2>
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>A valid email address you can access right now</span></li>
            <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>A phone number for SMS and account notifications</span></li>
            <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>Your full legal name (as it appears on your ID)</span></li>
            <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>A strong password (at least 8 characters, mix of letters and numbers)</span></li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-3">The 4 steps to open your account</h2>

          <h3 className="text-xl font-semibold mt-6 mb-2">Step 1 — Create your profile</h3>
          <p>
            Go to the APEX BANK sign-up page and enter your email and password. You&apos;ll receive a
            confirmation email; click the link to activate your profile. This usually takes under
            30 seconds.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Step 2 — Verify your identity</h3>
          <p>
            Enter your full name and phone number. APEX BANK verifies your identity electronically
            through our secure authentication provider — no paperwork, no scanning, no waiting in
            line.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Step 3 — Choose your account type and currency</h3>
          <p>
            Pick between a current account (for everyday spending) or a savings account (for
            growing your money). APEX BANK supports three currencies: AZN, USD and EUR. Your
            unique IBAN is generated automatically the moment your account is created.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-2">Step 4 — Order a card and start banking</h3>
          <p>
            Order a debit or credit card, set your limits, and you&apos;re done. From the dashboard
            you can send instant internal transfers to any other APEX BANK user, view your full
            transaction history, export CSV statements, and manage notifications.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-3">Why open your account online instead of at a branch?</h2>
          <div className="grid sm:grid-cols-2 gap-4 not-prose">
            <Card className="p-4">
              <Clock className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold mb-1">Faster</div>
              <p className="text-sm text-muted-foreground">2 minutes online vs. 30–60 minutes at a branch, plus travel time.</p>
            </Card>
            <Card className="p-4">
              <Wallet className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold mb-1">Cheaper</div>
              <p className="text-sm text-muted-foreground">Free account opening, free savings maintenance, free APEX-to-APEX transfers.</p>
            </Card>
            <Card className="p-4">
              <Smartphone className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold mb-1">Available 24/7</div>
              <p className="text-sm text-muted-foreground">Sign up at 3am if you want. No branch hours, no appointments.</p>
            </Card>
            <Card className="p-4">
              <ShieldCheck className="w-5 h-5 text-primary mb-2" />
              <div className="font-semibold mb-1">Just as secure</div>
              <p className="text-sm text-muted-foreground">Bcrypt-hashed passwords, JWT sessions, row-level security on every record.</p>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-3">Frequently asked questions</h2>

          <h3 className="text-lg font-semibold mt-6 mb-1">Can I open a bank account online without going to a branch?</h3>
          <p>Yes. With APEX BANK the entire process is online — you never need to visit a branch.</p>

          <h3 className="text-lg font-semibold mt-6 mb-1">How fast is it, really?</h3>
          <p>Most users complete signup in under two minutes and have a working IBAN immediately after.</p>

          <h3 className="text-lg font-semibold mt-6 mb-1">Is my money safe with an online bank?</h3>
          <p>
            APEX BANK uses the same security primitives as traditional banks: hashed passwords,
            JWT-based sessions, row-level security on the database, and atomic SQL transactions
            with row locks to prevent double-spends.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-1">What does it cost?</h3>
          <p>
            Opening an account is free. Savings accounts have no monthly fee; current accounts
            cost 1 AZN per month. Internal APEX-to-APEX transfers are always free.
          </p>

          <div className="not-prose mt-12 p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-bold mb-2">Ready to open your account?</h2>
            <p className="text-muted-foreground mb-4">
              Two minutes from now, you can have a working multi-currency bank account with a
              real IBAN and a card on the way.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Open my APEX BANK account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </article>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} APEX BANK
      </footer>
    </div>
  );
}