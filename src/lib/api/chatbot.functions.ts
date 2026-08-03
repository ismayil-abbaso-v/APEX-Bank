import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSecret } = await import("@/lib/secrets.server");
    const key =
      (await getSecret("OPEN_AI_API")) ??
      (await getSecret("OPENAI_API_KEY")) ??
      (await getSecret("OPENAI_API"));
    if (!key) throw new Error("AI xidməti hazırda əlçatan deyil (OPEN_AI_API tapılmadı)");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 700,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[chatbot] OpenAI ${res.status}: ${body}`);
      if (res.status === 429) throw new Error("Çox sayda sorğu — bir az sonra yenidən cəhd edin");
      if (res.status === 401) throw new Error("AI açarı yanlışdır — admin ilə əlaqə saxlayın");
      throw new Error("Cavab alınmadı, yenidən cəhd edin");
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Cavab alınmadı, yenidən cəhd edin");
    return { text };
  });
