// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { passwordRules, passwordScore, isStrongPassword, scoreLabel } from "@/lib/password";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  useEffect(() => {
    if (profile.data) { setName(profile.data.full_name ?? ""); setPhone(profile.data.phone ?? ""); }
  }, [profile.data]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: name.trim().slice(0, 120),
      phone: phone.trim().slice(0, 40),
      preferred_language: lang,
      preferred_theme: theme,
    }).eq("id", profile.data!.id);
    if (error) return toast.error(error.message);
    toast.success(t("success"));
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const changePassword = async () => {
    if (!oldPw) return toast.error("Cari şifrəni daxil edin");
    if (!isStrongPassword(newPw)) return toast.error("Yeni şifrə bütün tələblərə cavab vermir");
    if (newPw !== confirmPw) return toast.error("Şifrələr eyni deyil");
    setPwBusy(true);
    try {
      const email = (await supabase.auth.getUser()).data.user?.email;
      if (!email) throw new Error("Sessiya tapılmadı");
      const { error: rev } = await supabase.auth.signInWithPassword({ email, password: oldPw });
      if (rev) throw new Error("Cari şifrə yanlışdır");
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Şifrə yeniləndi");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) { toast.error((e as Error).message); }
    finally { setPwBusy(false); }
  };

  const score = passwordScore(newPw);
  const { label: scoreText, color: scoreColor } = scoreLabel(score);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t("settings")}</h1>
      <Card className="p-6 space-y-4">
        <div className="font-semibold">{t("profile")}</div>
        <div><Label>{t("fullName")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
        <div><Label>{t("phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} /></div>
      </Card>
      <Card className="p-6 space-y-4">
        <div className="font-semibold">{t("language")} & {t("theme")}</div>
        <div><Label>{t("language")}</Label>
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="az">Azərbaycan</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>{t("theme")}</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("light")}</SelectItem>
              <SelectItem value="dark">{t("dark")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Button onClick={save} className="gradient-primary border-0">{t("save")}</Button>

      <Card className="p-6 space-y-4">
        <div className="font-semibold">Şifrəni dəyiş</div>
        <div><Label>Cari şifrə</Label><Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" /></div>
        <div><Label>Yeni şifrə</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" /></div>
        {newPw.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-1">{[1,2,3,4,5].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? scoreColor : "bg-muted"}`} />)}</div>
            <div className="text-xs text-muted-foreground">Şifrə gücü: <span className="font-medium text-foreground">{scoreText}</span></div>
            <ul className="text-xs space-y-1">
              {passwordRules.map((r) => {
                const ok = r.test(newPw);
                return <li key={r.key} className={`flex items-center gap-1.5 ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>{ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {r.label}</li>;
              })}
            </ul>
          </div>
        )}
        <div><Label>Yeni şifrəni təkrarla</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" /></div>
        <Button onClick={changePassword} disabled={pwBusy} variant="secondary">{pwBusy ? "..." : "Şifrəni yenilə"}</Button>
      </Card>
    </div>
  );
}