import { useEffect, useState } from "react";

export type Priority = "high" | "medium" | "low";
export type Task = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string; // yyyy-mm-dd or ""
  minutes: number;
  done: boolean;
  createdAt: number;
};
export type ResearchNote = { id: string; query: string; result: string; createdAt: number };

export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
    return (a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1;
  });
}

export function daysUntil(deadline: string) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(deadline + "T00:00:00").getTime() - today.getTime()) / 86400000);
}

export async function streamGenerate(
  kind: "research" | "schedule",
  input: string,
  onText: (t: string) => void,
) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, input }),
  });
  if (!res.ok || !res.body) throw new Error((await res.text()) || "Request failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += dec.decode(value, { stream: true });
    onText(text);
  }
  if (!text.trim()) throw new Error("The AI returned no answer. Please try again.");
  return text;
}
