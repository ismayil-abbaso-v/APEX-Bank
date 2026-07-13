import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `Sən APEX BANK-ın rəsmi onlayn köməkçisisən. Yalnız bank və maliyyə ilə bağlı suallara cavab verirsən.

APEX BANK haqqında:
- Onlayn bankdır, filiala getmədən 2 dəqiqədə hesab açmaq olar.
- Hesab açmaq və aylıq xidmət tamamilə pulsuzdur (0 ₼).
- AZN, USD, EUR valyutalarında hesablar var: cari və əmanət.
- Əmanət hesablarına aylıq 0.5% faiz hesablanır.
- Cari hesablardan 1 AZN aylıq xidmət haqqı tutulur.
- APEX daxili köçürmələr 0 komissiya, saniyələrdə.
- IBAN və ya 16 rəqəmli kart nömrəsi ilə köçürmə dəstəklənir.
- Virtual və debet kartlar mövcuddur, 3D Secure ilə qorunur.
- Mobil və web tətbiq, biometrik giriş, üz tanıma və barmaq izi.
- 3 dildə dəstək: Azərbaycan, English, Русский.
- 24/7 canlı müştəri xidməti.
- Bütün əməliyyatlar uçdan-uca şifrələnir.

Qaydalar:
1. Yalnız bank, maliyyə, ödənişlər, kartlar, hesablar, köçürmələr, kreditlər, əmanətlər haqqında danış.
2. Cavablar qısa, dəqiq və azərbaycan dilində olsun (istifadəçi başqa dildə yazıbsa, o dildə cavab ver).
3. Şəxsi bank məlumatları (parol, PIN, CVV) heç vaxt soruşma və paylaşma — bunlar barəsində xəbərdarlıq et.
4. Mövzudan kənar sual gəlsə, kibarcasına yalnız bank suallarına cavab verdiyini bildir.
5. Texniki problemlərdə 24/7 dəstək xəttinə müraciət təklif et.
6. Markdown formatından istifadə edə bilərsən (qalın mətn, siyahılar).`;

export const chatbotAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSecret } = await import("@/lib/secrets.server");
    const key = await getSecret("LOVABLE_API_KEY");
    if (!key) throw new Error("AI xidməti hazırda əlçatan deyil");

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        messages: data.messages,
      });
      return { text };
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.includes("429")) throw new Error("Çox sayda sorğu — bir az sonra yenidən cəhd edin");
      if (msg.includes("402")) throw new Error("AI kredit limiti bitib — admin ilə əlaqə saxlayın");
      throw new Error("Cavab alınmadı, yenidən cəhd edin");
    }
  });
