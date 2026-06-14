import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { passwordRules, passwordScore, isStrongPassword, scoreLabel } from "@/lib/password";
import logoUrl from "@/assets/atu-logo.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "APEX BANK — Şifrəni yenilə" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically
    // and emits a PASSWORD_RECOVERY auth event. Mark page as ready once
    // a session exists (recovery session) or after a short delay so the form is usable.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    const t = setTimeout(() => setReady(true), 800);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const score = passwordScore(pw);
  const { label, color } = scoreLabel(score);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(pw)) { toast.error("Şifrə bütün tələblərə cavab vermir"); return; }
    if (pw !== confirm) { toast.error("Şifrələr eyni deyil"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Şifrə yeniləndi");
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white p-1.5 shadow-sm mb-3">
            <img src={logoUrl} alt="APEX" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Yeni şifrə təyin et</h1>
          <p className="text-sm text-muted-foreground mt-1">Tələblərə uyğun güclü şifrə seçin</p>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">Yüklənir...</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Yeni şifrə</Label>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} maxLength={72} className="pr-10" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pw.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? color : "bg-muted"}`} />)}
                  </div>
                  <div className="text-xs text-muted-foreground">Güc: <span className="font-medium text-foreground">{label}</span></div>
                  <ul className="text-xs space-y-1">
                    {passwordRules.map((r) => {
                      const ok = r.test(pw);
                      return <li key={r.key} className={`flex items-center gap-1.5 ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>{ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {r.label}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Şifrəni təkrarla</Label>
              <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} />
              {confirm.length > 0 && confirm !== pw && <p className="text-xs text-destructive">Şifrələr eyni deyil</p>}
            </div>
            <Button type="submit" disabled={busy} className="w-full gradient-primary border-0 h-11">{busy ? "..." : "Şifrəni yenilə"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
