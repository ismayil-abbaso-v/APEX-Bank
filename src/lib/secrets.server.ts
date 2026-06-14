// Server-only secret loader. Priority: process.env first (works in any host),
// then fall back to Supabase `app_settings` table so deployments like Vercel
// only need Supabase connection env vars — every other key lives in Supabase.
const cache = new Map<string, { value: string; expires: number }>();
const TTL_MS = 60_000;

export async function getSecret(key: string): Promise<string | undefined> {
  const envVal = process.env[key];
  if (envVal && envVal.trim()) return envVal.trim();

  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value || undefined;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    const value = (data?.value || "").trim();
    cache.set(key, { value, expires: Date.now() + TTL_MS });
    return value || undefined;
  } catch {
    return undefined;
  }
}