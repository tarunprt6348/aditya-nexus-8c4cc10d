import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatAssistant } from "@/lib/ai-assistant.functions";

type Msg = { role: "user" | "assistant"; content: string };

const INTRO: Msg = {
  role: "assistant",
  content:
    "Hi! I'm Aditya Assistant. Ask me about our construction, interiors, HVAC, solar or real-estate services — I can also help you request a quote.",
};

export function ChatAssistant() {
  const run = useServerFn(chatAssistant);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const out = (await run({ data: { messages: next.slice(-20) } })) as { reply: string };
      setMessages([...next, { role: "assistant", content: out.reply }]);
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, I couldn't respond just now. You can reach us at +91 96509 98403." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-medium text-navy shadow-lg shadow-navy/30 transition hover:scale-105"
        >
          <Sparkles className="h-4 w-4" /> Ask Aditya
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gold" />
              <div>
                <p className="text-sm font-medium">Aditya Assistant</p>
                <p className="text-[10px] text-navy-foreground/60">AI guide · replies in seconds</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-navy text-navy-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="inline h-3 w-3 animate-spin" /> thinking…
                </div>
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 border-t border-border bg-background p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={loading}
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-gold text-navy hover:bg-gold/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
