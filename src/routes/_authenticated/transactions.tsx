// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({ component: Txs });

function Txs() {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error; return data;
    },
  });

  const filtered = q.data?.filter((tx) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (tx.recipient_name?.toLowerCase().includes(s) || tx.description?.toLowerCase().includes(s) || tx.reference.toLowerCase().includes(s));
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t("transactions")}</h1>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="pl-9" />
      </div>
      <Card className="divide-y">
        {filtered?.map((tx) => {
          const isIn = tx.tx_type === "transfer_in" || tx.tx_type === "deposit";
          return (
            <div key={tx.id} className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIn ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{tx.recipient_name ?? tx.description ?? tx.tx_type}</div>
                <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString(lang)} · {tx.reference}</div>
                {tx.recipient_iban && <div className="text-xs font-mono text-muted-foreground truncate">{tx.recipient_iban}</div>}
              </div>
              <div className="text-right">
                <div className={`font-semibold ${isIn ? "text-success" : ""}`}>{isIn ? "+" : "-"}{formatMoney(Number(tx.amount), tx.currency, lang)}</div>
                <div className="text-xs text-muted-foreground">{t(tx.status as never)}</div>
              </div>
            </div>
          );
        })}
        {(!filtered || filtered.length === 0) && <div className="p-8 text-center text-muted-foreground">{t("noData")}</div>}
      </Card>
    </div>
  );
}