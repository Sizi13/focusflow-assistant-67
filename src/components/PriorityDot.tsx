import type { Task } from "@/lib/store";

export function PriorityDot({ p }: { p: Task["priority"] }) {
  const c = p === "high" ? "bg-primary" : p === "medium" ? "bg-chart-3" : "bg-accent";
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c}`} aria-label={`${p} priority`} />;
}
