// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — APEX BANK" },
      { name: "description", content: "Manage your APEX BANK accounts and IBANs across AZN, USD and EUR." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Accounts,
});

function Accounts() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"current" | "savings" | "deposit">("current");
  const [curr, setCurr] = useState<"AZN" | "USD" | "EUR">("AZN");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at");
      if (error) throw error; return data;
    },
  });

  const create = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("open_account", { p_type: type, p_currency: curr, p_name: name || "Account" });
      if (error) throw error;
      toast.success(t("success"));
      setOpen(false); setName("");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("accounts")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary border-0"><Plus className="w-4 h-4 mr-1" />{t("openAccount")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("openAccount")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("accountName")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} /></div>
              <div><Label>{t("accountType")}</Label>
                <Select value={type} onValueChange={(v) => setType(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">{t("current")}</SelectItem>
                    <SelectItem value="savings">{t("savings")}</SelectItem>
                    <SelectItem value="deposit">{t("deposit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("currency")}</Label>
                <Select value={curr} onValueChange={(v) => setCurr(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AZN">AZN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={create} disabled={busy} className="w-full gradient-primary border-0">{t("confirm")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {q.data?.map((a) => (
          <Card key={a.id} className="p-6">
            <div className="flex justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t(a.account_type as never)} · {a.currency}</div>
                <div className="font-semibold text-lg">{a.name ?? "Account"}</div>
              </div>
              {a.is_primary && <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">Primary</span>}
            </div>
            <div className="text-3xl font-bold mt-4">{formatMoney(Number(a.balance), a.currency, lang)}</div>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="truncate">{a.iban}</span>
              <button onClick={() => { navigator.clipboard.writeText(a.iban); toast.success(t("copied")); }}><Copy className="w-3 h-3" /></button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-mono">№ {a.account_number}</div>
          </Card>
        ))}
        {q.data?.length === 0 && <div className="text-muted-foreground">{t("noData")}</div>}
      </div>
    </div>
  );
}