import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Feather, RotateCcw, Square } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Ledger AI Workplace Assistant" },
      { name: "description", content: "Chat with an AI assistant to answer questions, draft content and brainstorm." },
      { property: "og:title", content: "AI Chat Assistant — Ledger" },
      { property: "og:description", content: "Ask questions and get helpful answers in a conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const KEY = "ledger.chat";

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try { setInitial(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setInitial([]); }
  }, []);
  const [version, setVersion] = useState(0);
  if (!initial) return null;
  return <Chat key={version} initial={initial} onReset={() => { localStorage.removeItem(KEY); setInitial([]); setVersion((v) => v + 1); }} />;
}

const suggestions = ["Draft a polite follow-up email to a client", "How do I run a productive 30-minute meeting?", "Give me 5 ideas to beat procrastination"];

function Chat({ initial, onReset }: { initial: UIMessage[]; onReset: () => void }) {
  const { messages, sendMessage, status, stop, error } = useChat({
    id: "ledger-main",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready") localStorage.setItem(KEY, JSON.stringify(messages));
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => { if (!busy) ta.current?.focus(); }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-screen">
      <PageHeader eyebrow="Assistant" title="Ask Ledger anything.">
        <Button variant="outline" onClick={onReset} disabled={busy || messages.length === 0}><RotateCcw className="h-4 w-4" /> New conversation</Button>
      </PageHeader>
      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <Feather className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 text-muted-foreground">Start with a question, or try one of these:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-ink-foreground">{text}</div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Feather className="h-4 w-4" /></span>
                <div className="prose-ink min-w-0 flex-1 text-sm"><ReactMarkdown>{text}</ReactMarkdown></div>
              </div>
            );
          })}
          {status === "submitted" && <p className="pl-10 text-sm text-muted-foreground animate-pulse">Thinking…</p>}
          {error && <p className="text-sm text-destructive">{error.message || "Something went wrong."}</p>}
          <div ref={end} />
        </div>
      </div>
      <div className="border-t border-border px-5 py-4 md:px-10">
        <form className="paper mx-auto flex max-w-3xl items-end gap-2 p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <textarea
            ref={ta}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Message Ledger…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            aria-label="Message"
          />
          {busy ? (
            <Button type="button" size="icon" variant="outline" onClick={() => stop()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
          )}
        </form>
      </div>
    </div>
  );
}
