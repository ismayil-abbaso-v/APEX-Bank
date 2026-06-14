// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendTransferEmail } from "@/lib/api/email.functions";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { Send, CheckCircle2, UserCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transfers")({ component: Transfers });

const schema = z.object({
  fromAccount: z.string().uuid("Mənbə hesab seçin"),
  destination: z.string().trim().min(10, "IBAN və ya kart nömrəsi daxil edin").max(40),
  recipient: z.string().trim().min(2).max(120),
  amount: z.number().positive().max(1_000_000),
  description: z.string().trim().max(200).optional(),
});

function Transfers() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const sendEmail = useServerFn(sendTransferEmail);
  const [fromAccount, setFrom] = useState("");
  const [destination, setDest] = useState("");
  const [recipient, setRec] = useState("");
  const [recipientLocked, setRecipientLocked] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await supabase.from("accounts").select("*").eq("is_active", true)).data ?? [],
  });

  useEffect(() => {
    const value = destination.replace(/\s/g, "");
    if (value.length < 10) { setRecipientLocked(false); return; }
    let active = true;
    setLookupLoading(true);
    const tm = setTimeout(async () => {
      const { data } = await supabase.rpc("lookup_recipient", { p_destination: value });
      if (!active) return;
      setLookupLoading(false);
      const r = data as { found?: boolean; recipient_name?: string } | null;
      if (r?.found && r.recipient_name) { setRec(r.recipient_name); setRecipientLocked(true); }
      else { setRecipientLocked(false); }
    }, 350);
    return () => { active = false; clearTimeout(tm); };
  }, [destination]);

  const validate = () => {
    const parsed = schema.safeParse({ fromAccount, destination, recipient, amount: Number(amount), description: desc });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return null; }
    const acct = accounts.data?.find((a) => a.id === parsed.data.fromAccount);
    if (acct && Number(acct.balance) < parsed.data.amount) { toast.error(t("insufficientFunds")); return null; }
    return parsed.data;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const doTransfer = async () => {
    const data = validate();
    if (!data) { setConfirmOpen(false); return; }
    setConfirmOpen(false);
    setBusy(true);
    try {
      const { data: result, error } = await supabase.rpc("execute_transfer_smart", {
        p_from_account: data.fromAccount,
        p_to_destination: data.destination,
        p_amount: data.amount,
        p_recipient_name: data.recipient,
        p_description: data.description ?? "",
      });
      if (error) throw error;
      const r = result as { reference: string; recipient_name?: string };
      const acct = accounts.data?.find((a) => a.id === data.fromAccount);
      toast.success(`${t("transferDone")} · ${r.recipient_name ?? recipient} · ${r.reference}`);

      // Send a professional confirmation email (best-effort, surfaces config errors)
      sendEmail({
        data: {
          reference: r.reference,
          amount: data.amount,
          currency: acct?.currency ?? "AZN",
          recipient: r.recipient_name ?? data.recipient,
          destination: data.destination,
          description: data.description,
        },
      })
        .then((res: any) => {
          if (res?.sent) {
            toast.success("Təsdiq məktubu e-poçtunuza göndərildi");
          } else if (res?.reason === "no_api_key") {
            toast.message("E-poçt xidməti hələ konfiqurasiya edilməyib (RESEND_API_KEY əskikdir)");
          } else if (res?.reason === "no_email") {
            toast.message("Profilinizdə e-poçt qeyd olunmayıb");
          } else if (res?.reason) {
            toast.error(`E-poçt göndərilmədi: ${res.reason}`);
          }
        })
        .catch((err: Error) => toast.error(`E-poçt xətası: ${err.message}`));

      setAmount(""); setDest(""); setRec(""); setDesc(""); setRecipientLocked(false);
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["recent-tx"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(msg.includes("insufficient") ? t("insufficientFunds") : msg);
    } finally { setBusy(false); }
  };

  const selectedAcct = accounts.data?.find((a) => a.id === fromAccount);
  const numericAmount = Number(amount) || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t("newTransfer")}</h1>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>{t("fromAccount")}</Label>
            <Select value={fromAccount} onValueChange={setFrom}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {accounts.data?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} · {formatMoney(Number(a.balance), a.currency, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>IBAN və ya Kart nömrəsi</Label>
            <Input value={destination} onChange={(e) => setDest(e.target.value)} maxLength={40} placeholder="AZ00ATUB... və ya 4169 •••• ••••" className="font-mono" />
            <div className="text-xs text-muted-foreground mt-1">IBAN ilə və ya 16-rəqəmli kart nömrəsi ilə köçürmə edə bilərsiniz</div>
          </div>
          <div>
            <Label>{t("recipientName")}</Label>
            <div className="relative">
              <Input value={recipient} onChange={(e) => setRec(e.target.value)} maxLength={120} readOnly={recipientLocked}
                className={recipientLocked ? "pr-10 bg-success/10" : "pr-10"} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {lookupLoading ? <UserCircle2 className="w-4 h-4 text-muted-foreground animate-pulse" /> :
                 recipientLocked ? <CheckCircle2 className="w-4 h-4 text-success" /> : null}
              </div>
            </div>
            {recipientLocked && <div className="text-xs text-success mt-1">✓ APEX müştərisi təsdiqləndi: {recipient}</div>}
          </div>
          <div>
            <Label>{t("amount")}</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0.01" />
            {selectedAcct && <div className="text-xs text-muted-foreground mt-1">{t("balance")}: {formatMoney(Number(selectedAcct.balance), selectedAcct.currency, lang)}</div>}
          </div>
          <div><Label>{t("description")}</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} rows={2} /></div>
          <Button type="submit" disabled={busy} className="w-full gradient-primary border-0"><Send className="w-4 h-4 mr-2" />{busy ? "..." : t("send")}</Button>
        </form>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Köçürməni təsdiq edin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm">Aşağıdakı əməliyyat dərhal icra olunacaq:</p>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Məbləğ</span><span className="font-bold text-foreground">{formatMoney(numericAmount, selectedAcct?.currency ?? "AZN", lang)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Alıcı</span><span className="font-medium text-foreground text-right truncate max-w-[60%]">{recipient || "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Hesab/Kart</span><span className="font-mono text-xs text-foreground text-right truncate max-w-[60%]">{destination}</span></div>
                  {selectedAcct && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Mənbə</span><span className="text-foreground text-right truncate max-w-[60%]">{selectedAcct.name}</span></div>}
                </div>
                <p className="text-xs text-muted-foreground">Təsdiq etdikdən sonra əməliyyat geri qaytarıla bilməz.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={doTransfer} className="bg-primary hover:bg-primary/90">Təsdiqlə və göndər</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
