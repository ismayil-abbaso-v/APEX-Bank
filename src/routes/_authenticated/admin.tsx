// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListCustomers, adminListAccounts, adminListTransactions,
  adminListUsers, adminToggleUserActive, adminResetPassword,
  adminCreateAdmin, adminDeleteUser, adminMonthlyProcessing, adminBankSummary,
  adminTopUp, adminTransfer,
} from "@/lib/api/admin.functions";
import { useIsAdmin } from "@/lib/useRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, CreditCard, ArrowLeftRight, Calendar, BarChart3, ShieldAlert, KeyRound, Trash2, UserPlus, Power, Terminal as TerminalIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — APEX BANK" },
      { name: "description", content: "APEX BANK administration panel for users, accounts and roles." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!checking && !isAdmin) navigate({ to: "/dashboard" });
  }, [checking, isAdmin, navigate]);

  if (checking) return <p className="p-8 text-muted-foreground">Yüklənir...</p>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin paneli</h1>
          <p className="text-sm text-muted-foreground">Bankın bütün əməliyyatlarını idarə edin</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="reports"><BarChart3 className="w-4 h-4 mr-1.5" />Hesabatlar</TabsTrigger>
          <TabsTrigger value="customers"><Users className="w-4 h-4 mr-1.5" />Müştərilər</TabsTrigger>
          <TabsTrigger value="accounts"><CreditCard className="w-4 h-4 mr-1.5" />Hesablar</TabsTrigger>
          <TabsTrigger value="transactions"><ArrowLeftRight className="w-4 h-4 mr-1.5" />Əməliyyatlar</TabsTrigger>
          <TabsTrigger value="monthly"><Calendar className="w-4 h-4 mr-1.5" />Aylıq</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />İstifadəçilər</TabsTrigger>
          <TabsTrigger value="terminal"><TerminalIcon className="w-4 h-4 mr-1.5" />Terminal</TabsTrigger>
        </TabsList>

        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
        <TabsContent value="accounts"><AccountsTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
        <TabsContent value="monthly"><MonthlyTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="terminal"><TerminalTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function fmt(n: number) { return new Intl.NumberFormat("az-AZ", { style: "currency", currency: "AZN" }).format(n); }

function ReportsTab() {
  const fn = useServerFn(adminBankSummary);
  const { data, isLoading } = useQuery({ queryKey: ["admin-summary"], queryFn: () => fn() });
  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Müştərilər" value={String(data.total_customers)} />
        <StatCard label="Hesablar" value={String(data.total_accounts)} />
        <StatCard label="Ümumi vəsait" value={fmt(data.total_funds)} />
        <StatCard label="Əməliyyatlar" value={String(data.total_tx)} />
      </div>
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top 5 müştəri (balansa görə)</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead className="text-right">Ümumi balans</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.top_customers.map((c) => (
              <TableRow key={c.id}><TableCell>{c.name || c.id.slice(0, 8)}</TableCell><TableCell className="text-right font-mono">{fmt(c.total)}</TableCell></TableRow>
            ))}
            {data.top_customers.length === 0 && <TableRow><TableCell colSpan={2} className="text-muted-foreground text-center">Məlumat yoxdur</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Aşağı balanslı hesablar</h3>
        <p className="text-3xl font-bold mt-2">{data.low_accounts}</p>
        <p className="text-xs text-muted-foreground mt-1">100 AZN-dən aşağı balansa sahib aktiv hesabların sayı</p>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}

function CustomersTab() {
  const fn = useServerFn(adminListCustomers);
  const toggleFn = useServerFn(adminToggleUserActive);
  const resetFn = useServerFn(adminResetPassword);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => fn() });
  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  const filtered = (data?.customers ?? []).filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s);
  });

  const toggle = async (id: string, active: boolean) => {
    try { await toggleFn({ data: { userId: id, active } }); toast.success(active ? "Müştəri aktivləşdirildi" : "Müştəri deaktiv edildi"); qc.invalidateQueries({ queryKey: ["admin-customers"] }); }
    catch (e) { toast.error((e as Error).message); }
  };
  const reset = async (id: string, email: string) => {
    try { const r = await resetFn({ data: { userId: id } }); setResetResult({ email, password: r.password }); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Ad, e-poçt və ya telefonla axtar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Ad</TableHead><TableHead>E-poçt</TableHead><TableHead>Telefon</TableHead>
            <TableHead className="text-right">Balans</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Əməliyyat</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell className="text-xs">{c.email}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{fmt(c.total_balance)}</TableCell>
                <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Aktiv" : "Deaktiv"}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => toggle(c.id, !c.is_active)} title="Aktivləşdir/Deaktiv et"><Power className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => reset(c.id, c.email)} title="Şifrəni sıfırla"><KeyRound className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Müştəri tapılmadı</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!resetResult} onOpenChange={(o) => !o && setResetResult(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni şifrə yaradıldı</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{resetResult?.email} üçün yeni şifrə (yalnız indi göstərilir):</p>
          <div className="font-mono text-lg bg-muted p-3 rounded select-all">{resetResult?.password}</div>
          <DialogFooter><Button onClick={() => { navigator.clipboard.writeText(resetResult?.password ?? ""); toast.success("Kopyalandı"); }}>Kopyala</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TerminalTab() {
  const topUpFn = useServerFn(adminTopUp);
  const transferFn = useServerFn(adminTransfer);
  const [mode, setMode] = useState<"topup" | "transfer">("topup");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) => setLog((l) => [`[${new Date().toLocaleTimeString()}] ${line}`, ...l].slice(0, 200));

  const run = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { toast.error("Düzgün məbləğ daxil edin"); return; }
    setBusy(true);
    try {
      if (mode === "topup") {
        if (!to.trim()) { toast.error("Hesab/IBAN/Kart daxil edin"); return; }
        const r = await topUpFn({ data: { destination: to.trim(), amount: amt, description: desc.trim() || undefined } });
        append(`✓ TOP-UP ${amt} → ${to.trim()} | ref=${r.reference} | yeni balans=${r.new_balance}`);
        toast.success("Pul hesaba əlavə olundu");
      } else {
        if (!from.trim() || !to.trim()) { toast.error("Mənbə və təyinat daxil edin"); return; }
        const r = await transferFn({ data: { fromDestination: from.trim(), toDestination: to.trim(), amount: amt, description: desc.trim() || undefined } });
        append(`✓ TRANSFER ${amt} | ${from.trim()} → ${to.trim()} | ref=${r.reference}`);
        toast.success("Köçürmə tamamlandı (limitsiz)");
      }
      setAmount(""); setDesc("");
    } catch (e) {
      const msg = (e as Error).message;
      append(`✗ XƏTA: ${msg}`);
      toast.error(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bank terminalı (limitsiz)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Hər hansı hesaba IBAN, hesab nömrəsi və ya kart nömrəsi ilə pul yükləyin və ya istənilən məbləğdə köçürmə edin. Heç bir limit yoxdur.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "topup" ? "default" : "outline"} onClick={() => setMode("topup")}>Pul yüklə</Button>
          <Button size="sm" variant={mode === "transfer" ? "default" : "outline"} onClick={() => setMode("transfer")}>Köçürmə</Button>
        </div>

        {mode === "transfer" && (
          <div className="space-y-1.5">
            <Label>Mənbə (IBAN / Hesab № / Kart №)</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="AZ.. və ya 16 rəqəmli kart" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>{mode === "topup" ? "Hesab (IBAN / Hesab № / Kart №)" : "Təyinat (IBAN / Hesab № / Kart №)"}</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="AZ.. və ya 16 rəqəmli kart" />
        </div>
        <div className="space-y-1.5">
          <Label>Məbləğ</Label>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Təsvir (istəyə bağlı)</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={255} />
        </div>
        <Button onClick={run} disabled={busy} className="w-full">{busy ? "..." : (mode === "topup" ? "Pulu yüklə" : "Köçürməni icra et")}</Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Terminal qeydləri</h3>
        <div className="bg-black text-green-400 font-mono text-xs rounded p-3 h-96 overflow-y-auto whitespace-pre-wrap">
          {log.length === 0 ? <span className="text-muted-foreground">Hələ heç bir əməliyyat yoxdur...</span> : log.join("\n")}
        </div>
      </Card>
    </div>
  );
}

function AccountsTab() {
  const fn = useServerFn(adminListAccounts);
  const { data, isLoading } = useQuery({ queryKey: ["admin-accounts"], queryFn: () => fn() });
  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  return (
    <Card className="p-0 overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Nömrə</TableHead><TableHead>IBAN</TableHead><TableHead>Növ</TableHead>
          <TableHead>Valyuta</TableHead><TableHead className="text-right">Balans</TableHead><TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {(data?.accounts ?? []).map((a: any) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-xs">{a.account_number}</TableCell>
              <TableCell className="font-mono text-xs">{a.iban}</TableCell>
              <TableCell>{a.account_type}</TableCell>
              <TableCell>{a.currency}</TableCell>
              <TableCell className="text-right font-mono">{Number(a.balance).toFixed(2)}</TableCell>
              <TableCell><Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Aktiv" : "Deaktiv"}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function TransactionsTab() {
  const fn = useServerFn(adminListTransactions);
  const { data, isLoading } = useQuery({ queryKey: ["admin-tx"], queryFn: () => fn() });
  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  return (
    <Card className="p-0 overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Tarix</TableHead><TableHead>Növ</TableHead><TableHead className="text-right">Məbləğ</TableHead>
          <TableHead>Valyuta</TableHead><TableHead>Təsvir</TableHead><TableHead>Referans</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {(data?.transactions ?? []).map((t: any) => (
            <TableRow key={t.id}>
              <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
              <TableCell>{t.tx_type}</TableCell>
              <TableCell className="text-right font-mono">{Number(t.amount).toFixed(2)}</TableCell>
              <TableCell>{t.currency}</TableCell>
              <TableCell className="text-xs max-w-xs truncate">{t.description}</TableCell>
              <TableCell className="font-mono text-xs">{t.reference}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function MonthlyTab() {
  const fn = useServerFn(adminMonthlyProcessing);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ savings_credited: number; current_charged: number } | null>(null);
  const run = async () => {
    setBusy(true);
    try { const r = await fn(); setResult(r); toast.success("Aylıq emal tamamlandı"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Aylıq emal: faiz və xidmət haqqı</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Bütün əmanət hesablarına 0.5% aylıq faiz hesablanır. Bütün cari hesablardan 1 AZN aylıq xidmət haqqı tutulur.
        Hər əməliyyat üçün ayrı tranzaksiya yazılır.
      </p>
      <Button className="mt-4" onClick={run} disabled={busy}>{busy ? "Emal olunur..." : "Aylıq emalı başlat"}</Button>
      {result && (
        <div className="mt-4 p-3 rounded bg-muted text-sm">
          <div>Faiz hesablanan əmanət hesabları: <strong>{result.savings_credited}</strong></div>
          <div>Xidmət haqqı tutulan cari hesablar: <strong>{result.current_charged}</strong></div>
        </div>
      )}
    </Card>
  );
}

function UsersTab() {
  const listFn = useServerFn(adminListUsers);
  const createFn = useServerFn(adminCreateAdmin);
  const deleteFn = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      await createFn({ data: { email, password: pw, fullName: name } });
      toast.success("Admin yaradıldı"); setOpen(false); setEmail(""); setName(""); setPw("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const del = async (id: string) => {
    if (!confirm("Bu istifadəçini silmək istədiyinizə əminsiniz?")) return;
    try { await deleteFn({ data: { userId: id } }); toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e) {
      const m = (e as Error).message;
      if (m === "last_admin") toast.error("Son admin silinə bilməz");
      else if (m === "self_delete_forbidden") toast.error("Özünüzü silə bilməzsiniz");
      else toast.error(m);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Yeni admin yarat</Button>
      </div>
      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>E-poçt</TableHead><TableHead>Rollar</TableHead><TableHead>Yaradılıb</TableHead>
            <TableHead>Son giriş</TableHead><TableHead className="text-right">Əməliyyat</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(data?.users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell className="space-x-1">{u.roles.map((r) => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}</TableCell>
                <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => del(u.id)} title="Sil"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni admin hesabı</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Ad Soyad</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>E-poçt</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Şifrə (ən az 8 simvol)</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Ləğv et</Button>
            <Button onClick={create} disabled={busy || !email || !name || pw.length < 8}>{busy ? "..." : "Yarat"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}