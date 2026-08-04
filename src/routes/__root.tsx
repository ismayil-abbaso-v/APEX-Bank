import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { ChatBot } from "@/components/chat-bot";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "siper-site-verification", content: "e7218be4eb003ad725a6081439bb4e69" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "APEX BANK — Online Banking" },
      { name: "description", content: "APEX BANK — secure online banking. Manage accounts, cards and transfers." },
      { name: "google-site-verification", content: "4goFn3kQEh6IJPvP0FC7req1HbOlT-Iya711_ZZIt3o" },
      { name: "theme-color", content: "#7a1f2b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "APEX BANK" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "APEX BANK — Online Banking" },
      { name: "twitter:title", content: "APEX BANK — Online Banking" },
      { property: "og:description", content: "APEX BANK — secure online banking. Manage accounts, cards and transfers." },
      { name: "twitter:description", content: "APEX BANK — secure online banking. Manage accounts, cards and transfers." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/396b2ece-fd2e-4bba-8486-6fbfdaadb733" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/396b2ece-fd2e-4bba-8486-6fbfdaadb733" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "APEX BANK" },
      { property: "og:locale", content: "en_US" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/jpeg", href: "/atu-logo.jpg" },
      { rel: "apple-touch-icon", href: "/atu-logo.jpg" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "APEX BANK",
          url: "https://apexbank.ismayil.site",
          logo: "https://apexbank.ismayil.site/atu-logo.jpg",
          sameAs: [],
          description: "APEX BANK — secure online banking. Accounts, cards and transfers in AZN, USD and EUR.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Outlet />
            <ChatBot />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
