import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamGenerate, useLocal, type ResearchNote } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research — Ledger AI Workplace Assistant" },
      { name: "description", content: "Research topics or paste articles to get summaries, key points, insights and recommendations." },
      { property: "og:title", content: "AI Research Assistant — Ledger" },
      { property: "og:description", content: "Summaries, key points and recommendations in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Research,
});

function Research() {
  const [notes, setNotes] = useLocal<ResearchNote[]>("ledger.research", []);
  const [query, setQuery] = useState("");
  const [live, setLive] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!query.trim()) return;
    setError("");
    setLoading(true);
    setActiveId(null);
    setLive("");
    try {
      const result = await streamGenerate("research", query, setLive);
      const note = { id: crypto.randomUUID(), query: query.trim().slice(0, 140), result, createdAt: Date.now() };
      setNotes((n) => [note, ...n].slice(0, 30));
      setActiveId(note.id);
      setQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const active = notes.find((n) => n.id === activeId);
  const content = active ? active.result : live;

  return (
    <>
      <PageHeader eyebrow="Research assistant" title="Understand anything, faster." />
      <div className="grid gap-6 p-5 md:p-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="paper p-4">
            <Textarea
              rows={4}
              placeholder="Ask a research question, name a topic, or paste an article to summarize…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter to run</span>
              <Button onClick={run} disabled={loading || !query.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Research
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <article className="paper prose-ink min-h-48 p-6 text-sm">
            {active && <p className="mb-2 font-display text-lg font-semibold">{active.query}</p>}
            {content ? <ReactMarkdown>{content}</ReactMarkdown> : <p className="text-muted-foreground">Results appear here with a summary, key points, insights and recommendations.</p>}
          </article>
        </div>
        <aside>
          <h2 className="mb-3 text-lg font-semibold">Saved research</h2>
          <ul className="space-y-2">
            {notes.length === 0 && <li className="text-sm text-muted-foreground">No saved research yet.</li>}
            {notes.map((n) => (
              <li key={n.id} className={`flex items-center gap-1 rounded-md border px-3 py-2 text-sm ${n.id === activeId ? "border-primary bg-card" : "border-border"}`}>
                <button className="min-w-0 flex-1 truncate text-left" onClick={() => setActiveId(n.id)}>{n.query}</button>
                <button aria-label="Delete" className="text-muted-foreground hover:text-destructive" onClick={() => { setNotes((x) => x.filter((y) => y.id !== n.id)); if (activeId === n.id) setActiveId(null); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
