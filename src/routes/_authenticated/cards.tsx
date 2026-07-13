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
import { formatCard, maskCard } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Eye, EyeOff, Lock, Unlock, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cards")({
  head: () => ({
    meta: [
      { title: "Cards — APEX BANK" },
      { name: "description", content: "Order and manage APEX BANK debit and credit cards with limits and freezing." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [acct, setAcct] = useState("");
  const [holder, setHolder] = useState("");
  const [type, setType] = useState<"debit" | "credit" | "virtual">("debit");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = async (key: string, value: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
      setCopied(key);
      toast.success(`${label} ✓`);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await supabase.from("accounts").select("*")).data ?? [],
  });
  const cards = useQuery({
    queryKey: ["cards"],
    queryFn: async () => (await supabase.from("cards").select("*, accounts(currency, name)").order("created_at", { ascending: false })).data ?? [],
  });

  const issue = async () => {
    if (!acct || !holder) return toast.error("Required");
    const { error } = await supabase.rpc("issue_card", { p_account_id: acct, p_card_type: type, p_holder: holder.toUpperCase() });
    if (error) return toast.error(error.message);
    toast.success(t("success")); setOpen(false); setHolder(""); setAcct("");
    qc.invalidateQueries({ queryKey: ["cards"] });
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "blocked" : "active";
    const { error } = await supabase.from("cards").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["cards"] });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("cards")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary border-0"><Plus className="w-4 h-4 mr-1" />{t("issueCard")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("issueCard")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("fromAccount")}</Label>
                <Select value={acct} onValueChange={setAcct}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.data?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.currency}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("cardHolder")}</Label><Input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={50} /></div>
              <div><Label>{t("type")}</Label>
                <Select value={type} onValueChange={(v) => setType(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">{t("debit")}</SelectItem>
                    <SelectItem value="credit">{t("credit")}</SelectItem>
                    <SelectItem value="virtual">{t("virtual")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={issue} className="w-full gradient-primary border-0">{t("confirm")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {cards.data?.map((c: { id: string; card_number: string; card_holder: string; expiry_month: number; expiry_year: number; status: string; card_type: string }) => {
          const visible = show[c.id];
          return (
            <Card key={c.id} className="p-6 card-shine text-white relative overflow-hidden">
              {c.status !== "active" && <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-destructive">{t(c.status as never)}</div>}
              <div className="flex justify-between text-sm opacity-80">
                <span>{t("appName")}</span><span className="uppercase">{c.card_type}</span>
              </div>
              <button
                type="button"
                onClick={() => copyValue(`num-${c.id}`, c.card_number, t("cards"))}
                className="mt-8 w-full text-left text-xl tracking-widest font-mono flex items-center justify-between gap-2 group"
                aria-label="Copy card number"
              >
                <span className="truncate">{visible ? formatCard(c.card_number) : maskCard(c.card_number)}</span>
                {copied === `num-${c.id}` ? <Check className="w-4 h-4 shrink-0 opacity-90" /> : <Copy className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
              </button>
              <div className="mt-6 flex justify-between text-xs gap-3">
                <button type="button" onClick={() => copyValue(`hold-${c.id}`, c.card_holder, t("cardHolder"))} className="text-left min-w-0 flex-1 group">
                  <div className="opacity-60 flex items-center gap-1">{t("cardHolder")} {copied === `hold-${c.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}</div>
                  <div className="font-semibold truncate">{c.card_holder}</div>
                </button>
                <button type="button" onClick={() => copyValue(`exp-${c.id}`, `${String(c.expiry_month).padStart(2,"0")}/${String(c.expiry_year).slice(-2)}`, t("expiry"))} className="text-left group">
                  <div className="opacity-60 flex items-center gap-1">{t("expiry")} {copied === `exp-${c.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}</div>
                  <div className="font-semibold">{String(c.expiry_month).padStart(2, "0")}/{String(c.expiry_year).slice(-2)}</div>
                </button>
                <div className="text-left" aria-label="CVV">
                  <div className="opacity-60">CVV</div>
                  <div className="font-semibold font-mono">•••</div>
                </div>
              </div>
              <div className="mt-5 flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => setShow((s) => ({ ...s, [c.id]: !s[c.id] }))}>
                  {visible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}{visible ? t("hideDetails") : t("showDetails")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => copyValue(`btn-${c.id}`, c.card_number, t("cards"))}>
                  {copied === `btn-${c.id}` ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}{t("copy") || "Copy"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleStatus(c.id, c.status)}>
                  {c.status === "active" ? <><Lock className="w-3 h-3 mr-1" />{t("block")}</> : <><Unlock className="w-3 h-3 mr-1" />{t("unblock")}</>}
                </Button>
              </div>
            </Card>
          );
        })}
        {cards.data?.length === 0 && <div className="text-muted-foreground col-span-2">{t("noData")}</div>}
      </div>
    </div>
  );
}
