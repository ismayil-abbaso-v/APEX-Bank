// @ts-nocheck
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, CreditCard, ArrowLeftRight, Receipt, Settings, LogOut, Moon, Sun, Globe, Bell, ShieldAlert, MoreHorizontal } from "lucide-react";
import { useIsAdmin } from "@/lib/useRole";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/atu-logo.png";

const LANG_LABELS: Record<Lang, string> = { az: "AZ", en: "EN", ru: "RU" };

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const { isAdmin } = useIsAdmin();

  const allItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/accounts", icon: Wallet, label: t("accounts") },
    { to: "/cards", icon: CreditCard, label: t("cards") },
    { to: "/transfers", icon: ArrowLeftRight, label: t("transfers") },
    { to: "/transactions", icon: Receipt, label: t("transactions") },
    { to: "/settings", icon: Settings, label: t("settings") },
    ...(isAdmin ? [{ to: "/admin", icon: ShieldAlert, label: "Admin" }] : []),
  ];

  // Bottom mobile nav: 4 primary tabs + "More"
  const bottomItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/accounts", icon: Wallet, label: t("accounts") },
    { to: "/cards", icon: CreditCard, label: t("cards") },
    { to: "/transfers", icon: ArrowLeftRight, label: t("transfers") },
  ];
  const moreItems = allItems.filter((i) => !bottomItems.some((b) => b.to === i.to));

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
      if (alive) setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("notif-shell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        load();
        try {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const n = (payload as { new?: { title?: string; body?: string } }).new || {};
            const notif = new Notification(n.title || "APEX BANK", {
              body: n.body || "",
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: "apex-bank-notif",
            });
            notif.onclick = () => { window.focus(); notif.close(); };
          }
        } catch { /* ignore */ }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  // Ask for native notification permission once
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const id = setTimeout(() => { Notification.requestPermission().catch(() => {}); }, 1200);
      return () => clearTimeout(id);
    }
  }, []);

  const markAllRead = async () => {
    if (unread === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setUnread(0);
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const askSignOut = () => setLogoutOpen(true);

  const Logo = ({ size = 40 }: { size?: number }) => (
    <div className="rounded-lg overflow-hidden bg-white p-1 shadow-sm shrink-0" style={{ width: size, height: size }}>
      <img src={logoUrl} alt="APEX BANK logo" className="w-full h-full object-contain" />
    </div>
  );

  const DesktopNavItems = () => (
    <>
      {allItems.map((it) => {
        const active = path === it.to;
        return (
          <Link key={it.to} to={it.to}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>
            <it.icon className="w-4 h-4" />{it.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Sidebar - desktop only */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <Link to="/dashboard" className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors" aria-label={t("dashboard")}>
          <Logo />
          <div className="min-w-0">
            <div className="font-bold text-lg leading-none truncate">{t("appName")}</div>
            <div className="text-xs text-sidebar-foreground/70 mt-1 truncate">{t("tagline")}</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto"><DesktopNavItems /></nav>
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <button onClick={askSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-accent">
            <LogOut className="w-4 h-4" />{t("logout")}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-16 shrink-0 border-b bg-card flex items-center justify-between px-4 md:px-8 gap-3">
          <div className="hidden md:block text-sm text-muted-foreground truncate">{user?.email}</div>
          <Link to="/dashboard" className="md:hidden flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity" aria-label={t("dashboard")}>
            <Logo size={32} /><span className="font-semibold truncate">{t("appName")}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/transactions" onClick={markAllRead} className="relative">
              <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="w-4 h-4" /></Button>
              {unread > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5"><Globe className="w-4 h-4" />{LANG_LABELS[lang]}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["az", "en", "ru"] as Lang[]).map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLang(l)}>{LANG_LABELS[l]}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={askSignOut} aria-label={t("logout")} className="hidden md:inline-flex">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>

        {/* Bottom navigation - mobile only */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t-2 shadow-[0_-4px_20px_-4px_rgba(80,10,20,0.25)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)", borderTopColor: "var(--primary)" }}
          aria-label="Primary"
        >
          <div className="grid grid-cols-5 h-16">
            {bottomItems.map((it) => {
              const active = path === it.to || path.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && <span className="absolute top-0 h-1 w-12 rounded-full" style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-glow), var(--primary))" }} />}
                  <it.icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
                  <span className="truncate max-w-full px-1">{it.label}</span>
                </Link>
              );
            })}

            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                    moreItems.some((m) => path === m.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="More"
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span>{t("settings") /* fallback label */ ? "•••" : "•••"}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <Logo size={36} />
                    <div className="min-w-0">
                      <div className="text-base font-bold truncate">{t("appName")}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {moreItems.map((it) => {
                    const active = path === it.to;
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-xs font-medium transition-colors",
                          active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                        )}
                      >
                        <it.icon className="w-5 h-5" />
                        <span className="truncate">{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => { setMoreOpen(false); setTimeout(() => setLogoutOpen(true), 100); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground py-3.5 text-sm font-semibold shadow-md active:scale-[0.98] transition-transform"
                >
                  <LogOut className="w-4 h-4" />{t("logout")}
                </button>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />{t("logoutTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("logoutConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onSignOut} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {t("logoutYes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
