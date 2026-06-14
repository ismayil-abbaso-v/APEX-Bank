// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lovable Cloud only — uses RPC functions (SECURITY DEFINER) for admin writes
// and admin SELECT policies for reads. No service role key required.

const PUBLIC_SUPABASE_URL = 'https://ivbkuiewaasytapkebdn.supabase.co';
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Ymt1aWV3YWFzeXRhcGtlYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzYwNzAsImV4cCI6MjA5Njk1MjA3MH0.NrH_nDyXELNqbwC9XKAfWdp_VsDxmzCyFaoGt3LXpAQ';

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles" as any)
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

function anonClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb: any = context.supabase;
    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, full_name, phone, email, is_active, date_of_birth, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p: any) => p.id);
    const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
    const { data: roles } = await sb.from("user_roles").select("user_id, role").in("user_id", safeIds);
    const { data: accts } = await sb.from("accounts").select("user_id, balance").in("user_id", safeIds);
    const rolesByUser: Record<string, string[]> = {};
    for (const r of roles ?? []) (rolesByUser[r.user_id] ??= []).push(r.role as string);
    const balByUser: Record<string, number> = {};
    for (const a of accts ?? []) balByUser[a.user_id] = (balByUser[a.user_id] ?? 0) + Number(a.balance);
    return {
      customers: (profiles ?? []).map((p: any) => ({
        id: p.id, full_name: p.full_name, phone: p.phone, email: p.email ?? "",
        is_active: p.is_active !== false, roles: rolesByUser[p.id] ?? ["user"],
        total_balance: balByUser[p.id] ?? 0, created_at: p.created_at,
      })),
    };
  });

export const adminListAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb: any = context.supabase;
    const { data, error } = await sb.from("accounts")
      .select("id, user_id, account_number, iban, account_type, currency, balance, is_active, created_at")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb: any = context.supabase;
    const { data, error } = await sb.from("transactions")
      .select("id, user_id, account_id, tx_type, status, amount, currency, description, recipient_name, recipient_iban, reference, created_at")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { transactions: data ?? [] };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb: any = context.supabase;
    const { data: profiles, error } = await sb.from("profiles")
      .select("id, email, full_name, is_active, created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p: any) => p.id);
    const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
    const { data: roles } = await sb.from("user_roles").select("user_id, role").in("user_id", safeIds);
    const rolesByUser: Record<string, string[]> = {};
    for (const r of roles ?? []) (rolesByUser[r.user_id] ??= []).push(r.role as string);
    return {
      users: (profiles ?? []).map((p: any) => ({
        id: p.id, email: p.email ?? "", roles: rolesByUser[p.id] ?? [],
        banned_until: p.is_active === false ? "deactivated" : null,
        created_at: p.created_at, last_sign_in_at: null,
      })),
    };
  });

export const adminToggleUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; active: boolean }) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { error } = await sb.rpc("admin_set_user_active", { p_user_id: data.userId, p_active: data.active });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { data: email, error } = await sb.rpc("admin_reset_password_for", { p_user_id: data.userId });
    if (error) throw new Error(error.message);
    const anon = anonClient();
    const { error: rpErr } = await anon.auth.resetPasswordForEmail(email as string);
    if (rpErr) throw new Error(rpErr.message);
    return { ok: true, email_sent_to: email as string };
  });

export const adminCreateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; fullName: string }) =>
    z.object({
      email: z.string().trim().email().max(255),
      password: z.string().min(8).max(72),
      fullName: z.string().trim().min(2).max(120),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const anon = anonClient();
    const { data: created, error } = await anon.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { full_name: data.fullName } },
    });
    if (error) throw new Error(error.message);
    const newId = created.user?.id;
    if (newId) {
      const sb: any = context.supabase;
      const { error: re } = await sb.rpc("admin_promote_to_admin", { p_user_id: newId });
      if (re) throw new Error(re.message);
    }
    return { ok: true, id: newId };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { error } = await sb.rpc("admin_delete_user", { p_user_id: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMonthlyProcessing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb: any = context.supabase;
    const { data, error } = await sb.rpc("admin_monthly_processing");
    if (error) throw new Error(error.message);
    return data as { savings_credited: number; current_charged: number };
  });

export const adminBankSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb: any = context.supabase;
    const { count: total_customers } = await sb.from("profiles").select("id", { count: "exact", head: true });
    const { count: total_accounts } = await sb.from("accounts").select("id", { count: "exact", head: true });
    const { data: bals } = await sb.from("accounts").select("balance");
    const total_funds = (bals ?? []).reduce((s: number, a: any) => s + Number(a.balance), 0);
    const { count: total_tx } = await sb.from("transactions").select("id", { count: "exact", head: true });
    const { data: accts } = await sb.from("accounts").select("user_id, balance");
    const byUser: Record<string, number> = {};
    for (const a of accts ?? []) byUser[a.user_id] = (byUser[a.user_id] ?? 0) + Number(a.balance);
    const topIds = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const { data: profs } = await sb.from("profiles").select("id, full_name")
      .in("id", topIds.length ? topIds.map(([id]) => id) : ["00000000-0000-0000-0000-000000000000"]);
    const nameById: Record<string, string> = {};
    for (const p of profs ?? []) nameById[p.id] = p.full_name;
    const top_customers = topIds.map(([id, bal]) => ({ id, name: nameById[id] ?? "", total: bal }));
    const low_accounts = (accts ?? []).filter((a: any) => Number(a.balance) < 100).length;
    return {
      total_customers: total_customers ?? 0,
      total_accounts: total_accounts ?? 0,
      total_funds, total_tx: total_tx ?? 0, top_customers, low_accounts,
    };
  });

export const adminTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { destination: string; amount: number; description?: string }) =>
    z.object({
      destination: z.string().trim().min(4).max(64),
      amount: z.number().positive().max(1e12),
      description: z.string().trim().max(255).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { data: res, error } = await sb.rpc("admin_topup", {
      p_destination: data.destination, p_amount: data.amount, p_description: data.description ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true, ...(res as any) };
  });

export const adminTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fromDestination: string; toDestination: string; amount: number; description?: string }) =>
    z.object({
      fromDestination: z.string().trim().min(4).max(64),
      toDestination: z.string().trim().min(4).max(64),
      amount: z.number().positive().max(1e12),
      description: z.string().trim().max(255).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const { data: res, error } = await sb.rpc("admin_transfer", {
      p_from: data.fromDestination, p_to: data.toDestination,
      p_amount: data.amount, p_description: data.description ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true, ...(res as any) };
  });