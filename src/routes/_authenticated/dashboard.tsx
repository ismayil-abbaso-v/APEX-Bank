// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, maskIban } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Plus, CreditCard, ArrowLeftRight, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t, lang } = useI18n();

  const profile = useQuery({
    queryKey: ["profile-name"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      return { fullName: data?.full_name ?? "", email: user.email ?? "" };
    },
  });
  const firstName = (profile.data?.fullName?.trim().split(/\s+/)[0]) || profile.data?.email?.split("@")[0] || "";


  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("is_primary", { ascending: false });
      if (error) throw error; return data;
    },
  });

  const txs = useQuery({
    queryKey: ["recent-tx"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(8);
      if (error) throw error; return data;
    },
  });

  const total = accounts.data?.reduce((s, a) => s + Number(a.balance), 0) ?? 0;
  const primary = accounts.data?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">{t("welcome")}{firstName ? `, ${firstName}` : ""}</h1>
        <p className="text-muted-foreground">{t("appName")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 card-shine text-white md:col-span-2">
          <div className="text-sm opacity-80">{t("totalBalance")}</div>
          <div className="text-4xl font-bold mt-2">{formatMoney(total, primary?.currency ?? "AZN", lang)}</div>
          {primary && <div className="mt-4 text-sm opacity-80 font-mono">{maskIban(primary.iban)}</div>}
          <div className="mt-6 flex gap-2 flex-wrap">
            <Link to="/transfers"><Button size="sm" variant="secondary"><ArrowLeftRight className="w-4 h-4 mr-1" />{t("newTransfer")}</Button></Link>
            <Link to="/accounts"><Button size="sm" variant="secondary"><Plus className="w-4 h-4 mr-1" />{t("openAccount")}</Button></Link>
            <Link to="/cards"><Button size="sm" variant="secondary"><CreditCard className="w-4 h-4 mr-1" />{t("issueCard")}</Button></Link>
          </div>
        </Card>
        <Card className="p-6">
          <div className="font-semibold mb-3">{t("quickActions")}</div>
          <div className="space-y-2">
            <Link to="/accounts" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"><Wallet className="w-4 h-4 text-primary" />{t("accounts")}</Link>
            <Link to="/cards" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"><CreditCard className="w-4 h-4 text-primary" />{t("cards")}</Link>
            <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"><ArrowLeftRight className="w-4 h-4 text-primary" />{t("transactions")}</Link>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">{t("accounts")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.data?.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t(a.account_type as never)} · {a.currency}</div>
              <div className="text-2xl font-bold mt-2">{formatMoney(Number(a.balance), a.currency, lang)}</div>
              <div className="text-xs text-muted-foreground font-mono mt-2 truncate">{a.iban}</div>
            </Card>
          ))}
          {accounts.data?.length === 0 && <div className="text-muted-foreground">{t("noData")}</div>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">{t("recentTx")}</h2>
        <Card className="divide-y">
          {txs.data?.map((tx) => {
            const isIn = tx.tx_type === "transfer_in" || tx.tx_type === "deposit";
            return (
              <div key={tx.id} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIn ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tx.recipient_name ?? tx.description ?? tx.tx_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString(lang)}</div>
                </div>
                <div className={`font-semibold ${isIn ? "text-success" : ""}`}>
                  {isIn ? "+" : "-"}{formatMoney(Number(tx.amount), tx.currency, lang)}
                </div>
              </div>
            );
          })}
          {(!txs.data || txs.data.length === 0) && <div className="p-8 text-center text-muted-foreground">{t("noData")}</div>}
        </Card>
      </div>
    </div>
  );
}