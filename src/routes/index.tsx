import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Globe, CreditCard, Smartphone, Lock, TrendingUp, Headphones, ArrowRight, CheckCircle2, Banknote, Building2, Sun, Moon, Zap, Wallet, Send, PiggyBank, Star, UserPlus, Download, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Lang } from "@/lib/i18n";
import logoUrl from "@/assets/atu-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "APEX BANK — Online Banking" },
      { name: "description", content: "Secure, fast and smart online banking with APEX BANK." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 sticky top-0 z-40 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
            <img src={logoUrl} alt="APEX" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg">{t("appName")}</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Üstünlüklər</a>
          <a href="#how" className="hover:text-foreground transition-colors">Necə işləyir</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="gap-1.5"><Globe className="w-4 h-4" />{lang.toUpperCase()}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["az", "en", "ru"] as Lang[]).map((l) => <DropdownMenuItem key={l} onClick={() => setLang(l)}>{l.toUpperCase()}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggle}>{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>
          <Link to="/auth" search={{ mode: "signin" }}><Button variant="ghost" className="hidden sm:inline-flex">{t("login")}</Button></Link>
          <Link to="/auth" search={{ mode: "signup" }}><Button className="gradient-primary border-0">{t("signup")}</Button></Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background animate-gradient-x" />
        <div className="absolute top-10 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl -z-10 animate-blob" />
        <div className="absolute -bottom-32 -left-20 w-[26rem] h-[26rem] rounded-full bg-primary-glow/20 blur-3xl -z-10 animate-blob" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-accent/40 blur-3xl -z-10 animate-blob" style={{ animationDelay: "6s" }} />
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full animate-fade-in-down">
              <ShieldCheck className="w-3.5 h-3.5" /> Bank səviyyəsində təhlükəsizlik · Lisenziyalı
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] animate-fade-in-up">
              Cibinizdəki <span className="text-primary bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent animate-gradient-x">smart bank</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg animate-fade-in-up delay-200">
              APEX BANK ilə hesab açın, kart sifariş edin və komissiyasız köçürmələr edin — hamısı 2 dəqiqədə, filiala getmədən.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap animate-fade-in-up delay-300">
              <Link to="/auth" search={{ mode: "signup" }}><Button size="lg" className="gradient-primary border-0 h-12 px-6 hover-glow">Pulsuz hesab aç <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              <Link to="/auth" search={{ mode: "signin" }}><Button size="lg" variant="outline" className="h-12 px-6 hover-lift">{t("login")}</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 text-sm border-t pt-6 animate-fade-in-up delay-500">
              <div><div className="text-2xl md:text-3xl font-bold text-primary">500K+</div><div className="text-muted-foreground mt-1">Aktiv müştəri</div></div>
              <div><div className="text-2xl md:text-3xl font-bold text-primary">24/7</div><div className="text-muted-foreground mt-1">Canlı dəstək</div></div>
              <div><div className="text-2xl md:text-3xl font-bold text-primary">0 ₼</div><div className="text-muted-foreground mt-1">Aylıq xidmət</div></div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto animate-scale-in delay-300">
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="relative w-[260px] sm:w-[280px] md:w-[320px] aspect-[9/19] bg-foreground rounded-[2.5rem] p-3 shadow-2xl mx-auto animate-float-slow">
              <div className="w-full h-full bg-background rounded-[2rem] overflow-hidden flex flex-col">
                <div className="h-8 flex items-center justify-center">
                  <div className="w-20 h-5 bg-foreground rounded-b-2xl" />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Xoş gəlmisən</div>
                  <div className="w-7 h-7 rounded-full bg-primary/20 animate-pulse" />
                </div>
                <div className="mx-4 aspect-[1.6/1] rounded-2xl card-shine p-4 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                  <div className="flex justify-between text-xs relative"><span className="opacity-80">APEX</span><span className="opacity-70">VISA</span></div>
                  <div className="text-sm tracking-widest font-mono relative">•••• 4829</div>
                  <div className="flex justify-between text-[10px] relative"><span>YOUR NAME</span><span>12/30</span></div>
                </div>
                <div className="mx-4 mt-4 grid grid-cols-4 gap-2 text-[10px] text-center">
                  {[{ i: Send, l: "Köçür" }, { i: Wallet, l: "Yüklə" }, { i: CreditCard, l: "Kart" }, { i: PiggyBank, l: "Yığ" }].map((q, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 animate-fade-in-up" style={{ animationDelay: `${600 + i * 100}ms` }}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:scale-110 transition-transform"><q.i className="w-4 h-4" /></div>
                      <span className="text-muted-foreground">{q.l}</span>
                    </div>
                  ))}
                </div>
                <div className="mx-4 mt-4 space-y-2 flex-1 overflow-hidden">
                  {[{ n: "Əli M.", a: "+250 ₼", c: "text-success" }, { n: "Marketdə", a: "−18.40 ₼", c: "" }, { n: "Sara K.", a: "+50 ₼", c: "text-success" }].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-fade-in-up" style={{ animationDelay: `${900 + i * 120}ms` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-semibold">{tx.n[0]}</div>
                        <span className="text-xs">{tx.n}</span>
                      </div>
                      <span className={`text-xs font-semibold ${tx.c}`}>{tx.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { i: Zap, t: "2 dəqiqədə hesab" },
            { i: Banknote, t: "Komissiyasız köçürmə" },
            { i: Shield, t: "3D Secure qoruma" },
            { i: Headphones, t: "24/7 canlı dəstək" },
          ].map((x, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground"><x.i className="w-4 h-4 text-primary" /><span>{x.t}</span></div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-3">Üstünlüklər</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Hər şey bir tətbiqdə</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Bank işlərinizi tam idarə edin — istənilən vaxt, istənilən cihazdan.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Banknote, title: "Pulsuz köçürmələr", desc: "APEX daxili köçürmələr 0 komissiya ilə, saniyələr içində." },
              { icon: CreditCard, title: "Anında virtual kart", desc: "Hesab açıldığı an virtual kart sifariş edin və onlayn ödəyin." },
              { icon: PiggyBank, title: "Əmanət hesabları", desc: "Sərfəli faiz dərəcələri ilə pulunuzu artırın." },
              { icon: Smartphone, title: "Mobil & Web", desc: "Telefon, planşet və komputerdə tam funksionallıq." },
              { icon: Lock, title: "Biometrik giriş", desc: "Üz tanıma və barmaq izi ilə təhlükəsiz daxil olun." },
              { icon: Globe, title: "3 dildə", desc: "Azərbaycan, English və Русский — sizin üçün rahat." },
            ].map((f, i) => (
              <Card key={i} className="p-6 hover-lift border-border/60 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 hover:scale-110 transition-transform"><f.icon className="w-6 h-6" /></div>
                <div className="font-semibold text-lg">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-3">Necə işləyir</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">3 sadə addımda başlayın</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: UserPlus, t: "Qeydiyyatdan keçin", d: "Ad, e-poçt və şifrə ilə 30 saniyəyə hesab yaradın." },
              { n: "02", icon: CreditCard, t: "Hesab və kart açın", d: "AZN/USD/EUR hesabları və virtual/debet kartlar bir kliklə." },
              { n: "03", icon: Send, t: "Köçürmələrə başlayın", d: "IBAN və ya kart nömrəsi ilə anında pul göndərin." },
            ].map((s, i) => (
              <Card key={i} className="p-7 relative overflow-hidden">
                <div className="absolute top-3 right-4 text-5xl font-bold text-primary/10">{s.n}</div>
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4"><s.icon className="w-6 h-6" /></div>
                <div className="font-semibold text-lg">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-2">{s.d}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSFER DEMO */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-3">Köçürmə</div>
            <h2 className="text-3xl md:text-4xl font-bold">Köçürmələr saniyələr içində</h2>
            <p className="mt-4 text-muted-foreground">IBAN və ya kart nömrəsi ilə anında köçürmə edin. Alıcı APEX müştərisidirsə adı avtomatik göstərilir və əməliyyat dərhal tamamlanır.</p>
            <ul className="mt-6 space-y-3">
              {["IBAN və kart nömrəsi ilə köçürmə","Alıcının adı avtomatik təsdiq","Hər iki tərəfə bildiriş","Tam əməliyyat tarixçəsi","Uçdan-uca şifrələnmə"].map((x, i) => (
                <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success shrink-0" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
          <Card className="p-6 space-y-4 shadow-xl">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Nümunə köçürmə</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg"><span className="text-sm">Hesabdan</span><span className="font-mono font-semibold text-sm">AZ21ATUB · AZN</span></div>
              <div className="text-center text-muted-foreground">↓</div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg"><span className="text-sm">Əli Məmmədov</span><span className="font-bold text-success">+250.00 ₼</span></div>
            </div>
            <Link to="/auth" search={{ mode: "signup" }}><Button className="w-full gradient-primary border-0 h-11">İndi başla</Button></Link>
          </Card>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Müştərilər nə deyir</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "Aysel H.", t: "İlk dəfədir filiala getmədən kart açıram. 2 dəqiqədə hər şey hazır idi." },
              { n: "Rəşad M.", t: "Pulsuz köçürmələr və sürətli tətbiq. Artıq əsas bankım APEX-dir." },
              { n: "Nigar Q.", t: "Dizayn çox sadədir, anam belə rahat istifadə edir. Müştəri xidməti də əla." },
            ].map((r, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-0.5 mb-3 text-warning">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-sm leading-relaxed">{r.t}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">{r.n[0]}</div>
                  <div className="text-sm font-medium">{r.n}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Tez-tez verilən suallar</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Hesab açmaq pulludur?", a: "Xeyr, APEX BANK-da hesab açmaq tamamilə pulsuzdur və aylıq xidmət haqqı tutulmur." },
              { q: "Köçürmələrdə komissiya var?", a: "APEX daxili köçürmələr 0 komissiya ilə həyata keçirilir." },
              { q: "Pulum nə qədər təhlükəsizdir?", a: "Bütün əməliyyatlar 3D Secure və uçdan-uca şifrələmə ilə qorunur." },
              { q: "Hansı dillərdə işləyir?", a: "Azərbaycan, English və Русский dillərində tam dəstək var." },
            ].map((f, i) => (
              <details key={i} className="group border rounded-xl p-5 hover:border-primary/40 transition-colors">
                <summary className="flex justify-between items-center cursor-pointer font-semibold list-none">
                  <span>{f.q}</span>
                  <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="max-w-4xl mx-auto px-4 md:px-10 text-center relative">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Bu gün APEX-ə qoşulun</h2>
          <p className="mt-4 opacity-90 max-w-xl mx-auto">Tətbiqi telefonunuzun ana ekranına əlavə edin və smart bank təcrübəsini dərhal yaşayın.</p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            <Link to="/auth" search={{ mode: "signup" }}><Button size="lg" variant="secondary" className="h-12 px-6">Pulsuz hesab yarat <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            <Button size="lg" variant="outline" className="h-12 px-6 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Download className="w-4 h-4 mr-2" />Tətbiqi əlavə et</Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-white p-0.5"><img src={logoUrl} alt="APEX" className="w-full h-full object-contain" /></div>
            <span className="font-semibold text-foreground">APEX BANK</span>
          </div>
          <div>© {new Date().getFullYear()} APEX BANK · Bütün hüquqlar qorunur</div>
          <div className="flex gap-4"><a href="#features" className="hover:text-foreground">Üstünlüklər</a><a href="#faq" className="hover:text-foreground">FAQ</a></div>
        </div>
      </footer>
    </div>
  );
}
