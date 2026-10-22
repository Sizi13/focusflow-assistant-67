import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { daysUntil, sortTasks, streamGenerate, useLocal, type Priority, type Task } from "@/lib/store";
import { PriorityDot } from "./index";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Planner — Ledger AI Workplace Assistant" },
      { name: "description", content: "Add tasks, set priorities and deadlines, and generate an AI daily schedule." },
      { property: "og:title", content: "AI Task Planner — Ledger" },
      { property: "og:description", content: "Prioritize tasks and get a time-blocked daily schedule from AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planner,
});

const selectCls = "h-9 rounded-md border border-input bg-card px-2 text-sm";

function Planner() {
  const [tasks, setTasks] = useLocal<Task[]>("ledger.tasks", []);
  const [schedule, setSchedule] = useLocal<string>("ledger.schedule", "");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [hours, setHours] = useState("09:00-17:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((ts) => [...ts, { id: crypto.randomUUID(), title: title.trim(), priority, deadline, minutes, done: false, createdAt: Date.now() }]);
    setTitle("");
  };
  const done = tasks.filter((t) => t.done).length;

  const generate = async () => {
    setError("");
    setLoading(true);
    const list = tasks
      .filter((t) => !t.done)
      .map((t) => `- ${t.title} | priority: ${t.priority} | deadline: ${t.deadline || "none"} | ~${t.minutes} min`)
      .join("\n");
    try {
      await streamGenerate("schedule", `Today is ${new Date().toDateString()}. Working hours: ${hours}.\nTasks:\n${list}`, setSchedule);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Task planner" title="Prioritize, schedule, finish.">
        <div className="w-48">
          <p className="mb-1 text-xs text-muted-foreground">{done}/{tasks.length} complete</p>
          <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} className="h-2" />
        </div>
      </PageHeader>
      <div className="grid gap-6 p-5 md:p-10 lg:grid-cols-[1fr_1.1fr]">
        <section className="space-y-4">
          <form onSubmit={add} className="paper space-y-3 p-4">
            <Input placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Task title" />
            <div className="flex flex-wrap gap-2">
              <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="date" className={selectCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="Deadline" />
              <select className={selectCls} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label="Estimate">
                {[15, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
              <Button type="submit" className="ml-auto"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </form>

          <ul className="paper divide-y divide-border">
            {tasks.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Your list is empty.</li>}
            {sortTasks(tasks).map((t) => {
              const d = daysUntil(t.deadline);
              return (
                <li key={t.id} className="flex items-center gap-3 p-3">
                  <Checkbox checked={t.done} onCheckedChange={(v) => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !!v } : x)))} aria-label={`Mark ${t.title} done`} />
                  <PriorityDot p={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.minutes} min · {d === null ? "no deadline" : d < 0 ? <span className="text-destructive">{-d}d overdue</span> : d === 0 ? "due today" : `due in ${d}d`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))} aria-label={`Delete ${t.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="paper p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-xl font-semibold">Today's schedule</h2>
            <Input className="w-36" value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Working hours" />
            <Button onClick={generate} disabled={loading || !tasks.some((t) => !t.done)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="prose-ink mt-4 text-sm">
            {schedule ? <ReactMarkdown>{schedule}</ReactMarkdown> : <p className="text-muted-foreground">Add tasks, set your hours, and let AI build a realistic plan.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
