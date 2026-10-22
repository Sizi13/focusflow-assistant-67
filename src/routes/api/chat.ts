import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { streamAi } from "@/server/ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        return streamAi(
          request,
          await convertToModelMessages(messages),
          "You are Ledger, a friendly, sharp workplace productivity assistant. Answer clearly and concisely using markdown. Help with planning, writing, analysis and everyday work questions.",
          "ui",
        );
      },
    },
  },
});
