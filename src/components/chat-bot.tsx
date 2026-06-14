import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatbotAsk } from "@/lib/api/chatbot.functions";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Salam! Mən **APEX BANK** köməkçisiyəm 🤖\n\nBankımız, hesablar, kartlar, köçürmələr və ya komissiyalar haqqında istənilən sualı verə bilərsiniz.",
};

const SUGGESTIONS = [
  "Hesab necə açıram?",
  "Köçürmə komissiyası nə qədərdir?",
  "Hansı kartlar var?",
  "Əmanət faizi nə qədərdir?",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const ask = useServerFn(chatbotAsk);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next.map((m) => ({ role: m.role, content: m.content })) } });
      setMessages((m) => [...m, { role: "assistant", content: r.text }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating button — hidden when the chat is open so it doesn't overlap the send button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="APEX köməkçisi"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          className={cn(
            "fixed right-4 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-primary-foreground transition-all duration-300",
            "md:!bottom-6",
            "bg-gradient-to-br from-primary to-primary/70 hover:scale-110 active:scale-95",
            "animate-bounce-soft"
          )}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping-slow -z-10" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed z-[59] bg-card border shadow-2xl flex flex-col animate-chat-in",
            "inset-x-2 top-16 rounded-2xl",
            "md:inset-auto md:bottom-24 md:right-4 md:top-auto md:w-[380px] md:h-[560px]"
          )}
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-2xl">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-tight">APEX köməkçisi</div>
              <div className="text-[11px] opacity-80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Onlayn · Bank sualları
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10" aria-label="Bağla">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2 animate-fade-in", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm max-w-[78%] leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border rounded-tl-sm"
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-2 animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-card border rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            {messages.length <= 1 && !busy && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] text-muted-foreground px-1">Tez başla:</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-2 border-t bg-card rounded-b-2xl flex gap-2"
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bank haqqında sualınız..."
              disabled={busy}
              maxLength={500}
              className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} className="shrink-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
