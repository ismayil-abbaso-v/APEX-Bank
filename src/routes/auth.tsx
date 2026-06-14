// @ts-nocheck
import { createFileRoute, useNavigate, Navigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Moon, Sun, Globe, Eye, EyeOff, Check, X, ArrowLeft, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Lang } from "@/lib/i18n";
import { passwordRules, passwordScore, isStrongPassword, scoreLabel } from "@/lib/password";
import logoUrl from "@/assets/atu-logo.png";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "APEX BANK — Daxil ol" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const redirectByRole = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) { navigate({ to: "/dashboard" }); return; }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    navigate({ to: roleRow ? "/admin" : "/dashboard" });
  };

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const score = passwordScore(password);
  const { label: scoreText, color: scoreColor } = scoreLabel(score);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isForgot) {
        const parsed = z.string().trim().email("Düzgün e-poçt daxil edin").safeParse(email);
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Şifrə bərpa linki e-poçtunuza göndərildi");
        navigate({ to: "/auth", search: { mode: "signin" } });
        return;
      }

      if (isSignup) {
        const schema = z.object({
          fullName: z.string().trim().min(2, "Ad ən az 2 simvol").max(120),
          email: z.string().trim().email("Düzgün e-poçt").max(255),
          phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/u, "Telefon nömrəsi düzgün deyil").or(z.literal("")),
          password: z.string().min(8, "Şifrə ən az 8 simvol"),
        });
        const parsed = schema.safeParse({ fullName, email, phone, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        if (!isStrongPassword(password)) { toast.error("Şifrə bütün tələblərə cavab vermir"); return; }
        if (password !== confirm) { toast.error("Şifrələr eyni deyil"); return; }

        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
          },
        });
        if (error) throw error;
        toast.success("Hesab uğurla yaradıldı");
        await redirectByRole();
      } else {
        const parsed = z.object({
          email: z.string().trim().email("Düzgün e-poçt"),
          password: z.string().min(1, "Şifrə daxil edin"),
        }).safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) toast.error("E-poçt və ya şifrə yanlışdır");
          else toast.error(error.message);
          return;
        }
        await redirectByRole();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Top bar (always visible, simple on mobile) */}
      <header className="h-14 px-4 md:px-8 flex items-center justify-between border-b bg-card/60 backdrop-blur sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-white p-0.5 shrink-0">
            <img src={logoUrl} alt="APEX" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold truncate">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5"><Globe className="w-4 h-4" />{lang.toUpperCase()}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["az", "en", "ru"] as Lang[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLang(l)}>{l.toUpperCase()}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggle}>{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 md:py-12">
        <Card className="w-full max-w-md p-6 md:p-8 shadow-lg">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1.5 shadow-sm mb-3">
              <img src={logoUrl} alt="APEX" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold">
              {isSignup ? "Hesab yarat" : isForgot ? "Şifrəni bərpa et" : "Xoş gəlmisiniz"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignup ? "Bir neçə saniyəyə hesabınızı yaradın" : isForgot ? "E-poçtunuza bərpa linki göndərək" : "Hesabınıza daxil olun"}
            </p>
          </div>

          {isForgot && (
            <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
              className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Geri
            </button>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fn">Ad Soyad</Label>
                  <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required maxLength={120} placeholder="Adınız Soyadınız" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph">Telefon (istəyə bağlı)</Label>
                  <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" type="tel" maxLength={40} placeholder="+994 ..." />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="em">E-poçt</Label>
              <Input id="em" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required maxLength={255} placeholder="adiniz@example.com" inputMode="email" />
            </div>

            {!isForgot && (
              <div className="space-y-1.5">
                <Label htmlFor="pw">Şifrə</Label>
                <div className="relative">
                  <Input id="pw" value={password} onChange={(e) => setPassword(e.target.value)}
                    type={showPw ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required minLength={isSignup ? 8 : 1} maxLength={72}
                    placeholder={isSignup ? "Güclü şifrə yaradın" : "Şifrəniz"}
                    className="pr-10" />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label="toggle">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {isSignup && password.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? scoreColor : "bg-muted"}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">Şifrə gücü: <span className="font-medium text-foreground">{scoreText}</span></div>
                    <ul className="grid grid-cols-1 gap-1 text-xs mt-1">
                      {passwordRules.map((r) => {
                        const ok = r.test(password);
                        return (
                          <li key={r.key} className={`flex items-center gap-1.5 ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                            {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {r.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="cpw">Şifrəni təkrarla</Label>
                <Input id="cpw" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  type={showPw ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-destructive">Şifrələr eyni deyil</p>
                )}
              </div>
            )}

            {!isSignup && !isForgot && (
              <div className="flex justify-end">
                <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "forgot" } })}
                  className="text-sm text-primary hover:underline">
                  Şifrəni unutmusunuz?
                </button>
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full gradient-primary border-0 h-11 text-base">
              {busy ? "..." : isSignup ? "Hesab yarat" : isForgot ? "Bərpa linkini göndər" : "Daxil ol"}
            </Button>
          </form>

          {!isForgot && (
            <div className="mt-6 text-center text-sm">
              {isSignup ? (
                <>
                  Artıq hesabın var?{" "}
                  <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                    className="text-primary hover:underline font-medium">Daxil ol</button>
                </>
              ) : (
                <>
                  Hesabın yoxdur?{" "}
                  <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                    className="text-primary hover:underline font-medium">Hesab yarat</button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" /> Bank səviyyəsində şifrələnmiş bağlantı
          </div>
        </Card>
      </main>
    </div>
  );
}