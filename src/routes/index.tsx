import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenText, ListChecks, MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PriorityDot } from "@/components/PriorityDot";
import { Progress } from "@/components/ui/progress";
import { daysUntil, sortTasks, useLocal, type ResearchNote, type Task } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ledger AI Workplace Assistant" },
      { name: "description", content: "See today's tasks, deadlines, progress and recent research at a glance." },
      { property: "og:title", content: "Dashboard — Ledger" },
      { property: "og:description", content: "Your AI productivity dashboard: tasks, research and chat in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [tasks] = useLocal<Task[]>("ledger.tasks", []);
  const [notes] = useLocal<ResearchNote[]>("ledger.research", []);
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = sortTasks(tasks).filter((t) => !t.done).slice(0, 5);
  const overdue = tasks.filter((t) => !t.done && (daysUntil(t.deadline) ?? 1) < 0).length;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <PageHeader eyebrow={today} title="Good to see you. Here's your day." />
      <div className="grid gap-5 p-5 md:grid-cols-3 md:p-10">
        <Stat label="Open tasks" value={tasks.length - done} />
        <Stat label="Overdue" value={overdue} tone={overdue ? "text-destructive" : undefined} />
        <div className="paper p-5">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="mt-1 font-display text-4xl font-semibold">{pct}%</p>
          <Progress value={pct} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{done} of {tasks.length} done</p>
        </div>

        <section className="paper p-5 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Up next</h2>
            <Link to="/planner" className="flex items-center gap-1 text-sm text-primary">Planner <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No open tasks. Add some in the Planner and let AI build your day.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => {
                const d = daysUntil(t.deadline);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex items-center gap-3">
                      <PriorityDot p={t.priority} />
                      {t.title}
                    </span>
                    <span className={`text-xs ${d !== null && d < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {d === null ? "No deadline" : d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `In ${d}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="paper p-5">
          <h2 className="mb-3 text-xl font-semibold">Recent research</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {notes.slice(0, 4).map((n) => (
                <li key={n.id} className="truncate border-l-2 border-primary pl-3">{n.query}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-5 md:col-span-3 md:grid-cols-3">
          <Tool to="/planner" icon={ListChecks} title="Plan my day" text="Prioritize tasks and get an AI time-blocked schedule." />
          <Tool to="/research" icon={BookOpenText} title="Research a topic" text="Summaries, key points, insights and next steps." />
          <Tool to="/chat" icon={MessagesSquare} title="Ask the assistant" text="Draft, brainstorm, or get answers in a conversation." />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string | undefined }) {
  return (
    <div className="paper p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-4xl font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Tool({ to, icon: Icon, title, text }: { to: "/planner" | "/research" | "/chat"; icon: typeof ListChecks; title: string; text: string }) {
  return (
    <Link to={to} className="group rounded-lg bg-ink p-5 text-ink-foreground transition-transform hover:-translate-y-0.5">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-70">{text}</p>
    </Link>
  );
}
