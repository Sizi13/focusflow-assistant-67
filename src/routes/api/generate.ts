import { createFileRoute } from "@tanstack/react-router";
import { streamAi } from "@/server/ai";

const PROMPTS = {
  research:
    "You are a meticulous research assistant. Given a topic, question, or pasted article, respond in markdown with these sections: ## Summary (3-5 sentences), ## Key Points (bullets), ## Insights, ## Recommendations (actionable bullets). Note uncertainty honestly; do not invent citations.",
  schedule:
    "You are an expert daily planner. Given a list of tasks (with priority, deadline, estimated minutes, status) plus the user's working hours, produce a realistic time-blocked schedule for today in markdown. Start with a one-line focus statement, then a table with columns Time | Task | Why now. Put high-priority and near-deadline tasks first, add short breaks, and end with 2-3 bullet tips. Skip completed tasks.",
} as const;

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { kind, input } = (await request.json()) as { kind: keyof typeof PROMPTS; input: string };
        if (!PROMPTS[kind] || typeof input !== "string" || !input.trim()) {
          return new Response("Invalid request", { status: 400 });
        }
        return streamAi(request, [{ role: "user", content: input.slice(0, 40000) }], PROMPTS[kind], "text");
      },
    },
  },
});
