import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FALLBACK_PUBLIC_ORIGIN = "https://equal-balance-bot.lovable.app";

const TransferEmailSchema = z.object({
  reference: z.string().min(1).max(80),
  amount: z.number().positive(),
  currency: z.string().min(1).max(8),
  recipient: z.string().min(1).max(160),
  destination: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  fromName: z.string().max(160).optional(),
});

function renderTransferHtml(args: {
  fullName: string;
  amount: number;
  currency: string;
  recipient: string;
  destination: string;
  reference: string;
  description?: string;
  date: string;
  logoUrl: string;
  direction?: "out" | "in";
  senderName?: string;
}) {
  const fmt = new Intl.NumberFormat("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(args.amount);
  const isIn = args.direction === "in";
  const title = isIn ? "Hesabınıza köçürmə daxil oldu" : "Köçürmə uğurla tamamlandı";
  const intro = isIn
    ? `<b>${escapeHtml(args.senderName || "APEX müştəri")}</b> tərəfindən hesabınıza köçürmə daxil oldu.`
    : "Aşağıdakı köçürmə əməliyyatınız APEX BANK tərəfindən uğurla emal edildi.";
  const amountLabel = isIn ? "Daxil olan məbləğ" : "Köçürmə məbləği";
  return `<!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>APEX BANK</title></head>
<body style="margin:0;padding:0;background:#f4f1f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1b1b1b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f1;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(80,10,20,0.10);">
        <tr><td style="background:linear-gradient(135deg,#3a0a14,#7a1830);padding:32px;color:#ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="56" valign="middle"><img src="${escapeHtml(args.logoUrl)}" width="48" height="48" alt="APEX BANK" style="display:block;border-radius:12px;background:#ffffff;object-fit:cover;"></td>
            <td valign="middle"><div style="font-size:13px;letter-spacing:3px;opacity:.9;font-weight:700;">APEX BANK</div><div style="font-size:12px;opacity:.78;margin-top:3px;">Sənin maliyyə partnyorun</div></td>
          </tr></table>
          <div style="font-size:24px;font-weight:700;margin-top:8px;line-height:1.2;">${title}</div>
          <div style="font-size:13px;opacity:.85;margin-top:6px;">${args.date}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;">Hörmətli <b>${escapeHtml(args.fullName)}</b>,</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">${intro}</p>

          <div style="background:#faf6f6;border:1px solid #f0e3e5;border-radius:12px;padding:20px 22px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#7a1830;font-weight:700;">${amountLabel}</div>
            <div style="font-size:30px;font-weight:800;color:#1b1b1b;margin-top:4px;">${fmt} ${escapeHtml(args.currency)}</div>
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
            ${row(isIn ? "Göndərən" : "Alıcı", escapeHtml(args.recipient))}
            ${row(isIn ? "Hesabınız" : "Hesab / Kart", escapeHtml(args.destination))}
            ${args.description ? row("Təyinat", escapeHtml(args.description)) : ""}
            ${row("Əməliyyat nömrəsi", `<span style="font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${escapeHtml(args.reference)}</span>`)}
            ${row("Status", `<span style="color:#0a7d3b;font-weight:600;">✓ Tamamlandı</span>`)}
          </table>

          <div style="margin-top:24px;background:#fff8f8;border-left:4px solid #7a1830;padding:14px 18px;border-radius:8px;font-size:13px;color:#5a5a5a;line-height:1.55;">
            Bu əməliyyatı siz etməmisinizsə, dərhal 24/7 dəstək xəttimizə müraciət edin və hesabınızı bloklatdırın.
          </div>

          <p style="margin:28px 0 0;font-size:14px;color:#555;">Hörmətlə,<br><b style="color:#1b1b1b;">APEX BANK Müştəri Xidmətləri</b></p>
        </td></tr>
        <tr><td style="background:#160407;color:#d4b3b9;padding:20px 32px;font-size:12px;text-align:center;line-height:1.6;">
          © ${new Date().getFullYear()} APEX BANK · Bütün hüquqlar qorunur<br>
          <span style="opacity:.7;">Bu rəsmi bildiriş avtomatik göndərilmişdir · support@apexbank.az</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0eaea;color:#777;width:42%;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0eaea;color:#1b1b1b;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function getPublicOrigin() {
  const requestOrigin = getRequest()?.headers?.get("origin");
  const vercelOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const origin = requestOrigin || (vercelOrigin ? `https://${vercelOrigin}` : FALLBACK_PUBLIC_ORIGIN);
  return origin.replace(/\/$/, "");
}

export const sendTransferEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TransferEmailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { sent: false, reason: "no_api_key" };

    const { data: prof } = await context.supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", context.userId)
      .maybeSingle();

    const email = prof?.email;
    if (!email) return { sent: false, reason: "no_email" };

    const html = renderTransferHtml({
      fullName: prof?.full_name || "Müştəri",
      amount: data.amount,
      currency: data.currency,
      recipient: data.recipient,
      destination: data.destination,
      reference: data.reference,
      description: data.description,
      date: new Date().toLocaleString("az-AZ", { dateStyle: "long", timeStyle: "short" }),
      logoUrl: `${getPublicOrigin()}/atu-logo.jpg`,
      direction: "out",
    });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "APEX BANK <onboarding@resend.dev>",
          to: [email],
          subject: `APEX BANK · Köçürmə tamamlandı · ${data.reference}`,
          html,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return { sent: false, reason: `resend_${res.status}`, detail: txt.slice(0, 200) };
      }
      // Best-effort: also notify the recipient if they are an APEX customer.
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const normalized = data.destination.replace(/\s+/g, "").toUpperCase();
        let recipientAccount: { user_id: string; iban: string } | null = null;
        const { data: byIban } = await supabaseAdmin
          .from("accounts")
          .select("user_id, iban")
          .ilike("iban", normalized)
          .maybeSingle();
        if (byIban) recipientAccount = { user_id: byIban.user_id, iban: byIban.iban };
        if (!recipientAccount) {
          const { data: byCard } = await supabaseAdmin
            .from("cards")
            .select("account_id, accounts!inner(user_id, iban)")
            .eq("card_number", normalized)
            .maybeSingle();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const acc = (byCard as any)?.accounts;
          if (acc) recipientAccount = { user_id: acc.user_id, iban: acc.iban };
        }
        if (recipientAccount && recipientAccount.user_id !== context.userId) {
          const { data: rprof } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("id", recipientAccount.user_id)
            .maybeSingle();
          if (rprof?.email) {
            const incomingHtml = renderTransferHtml({
              fullName: rprof.full_name || "Müştəri",
              amount: data.amount,
              currency: data.currency,
              recipient: prof?.full_name || data.fromName || "APEX müştəri",
              destination: recipientAccount.iban,
              reference: data.reference,
              description: data.description,
              date: new Date().toLocaleString("az-AZ", { dateStyle: "long", timeStyle: "short" }),
              logoUrl: `${getPublicOrigin()}/atu-logo.jpg`,
              direction: "in",
              senderName: prof?.full_name || data.fromName || "APEX müştəri",
            });
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "APEX BANK <onboarding@resend.dev>",
                to: [rprof.email],
                subject: `APEX BANK · Hesabınıza köçürmə daxil oldu · ${data.reference}`,
                html: incomingHtml,
              }),
            });
          }
        }
      } catch (e) {
        console.error("recipient email failed", e);
      }
      return { sent: true };
    } catch (e) {
      return { sent: false, reason: (e as Error).message };
    }
  });
