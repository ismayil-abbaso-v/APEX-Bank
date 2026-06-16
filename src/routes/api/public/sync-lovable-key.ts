import { createFileRoute } from "@tanstack/react-router";

// One-shot internal helper: copies process.env.LOVABLE_API_KEY into
// the Supabase `app_settings` table so other deployments (Vercel) can
// read it via getSecret(). Call once from the Lovable preview, then
// the value is available everywhere.
export const Route = createFileRoute("/api/public/sync-lovable-key")({
  server: {
    handlers: {
      POST: async () => {
        const key = process.env.LOVABLE_API_KEY?.trim();
        if (!key) {
          return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY not in env" }), { status: 500 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("app_settings")
          .upsert({ key: "LOVABLE_API_KEY", value: key }, { onConflict: "key" });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({ ok: true, length: key.length }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});