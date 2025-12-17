import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { StreamEvent, Message } from "@/lib/types";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper to format SSE event
function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const { messages, userEmail }: { messages: Message[]; userEmail?: string } =
    await req.json();

  // Convert our simple Message type to CoreMessage format
  const coreMessages: CoreMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Build dynamic system prompt with email context
  const emailContext = userEmail
    ? `\n\n## User Context\nUser's Gmail: ${userEmail} (already set, do not ask again)`
    : `\n\n## User Context\nUser's Gmail: NOT SET. You MUST call setEmail before calling generateDocument.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({
          model: openai("gpt-4o"),
          system: SYSTEM_PROMPT + emailContext,
          messages: coreMessages,
          tools: {
            setProject: {
              description:
                "Set or update the project name based on what the user wants to build. Call this when you understand what project the user is working on.",
              inputSchema: z.object({
                name: z.string().describe("A concise, descriptive project name"),
              }),
            },
            setEmail: {
              description:
                "Set the user's Gmail address for Google Workspace integration. MUST be called before generateDocument if email is not already set. Ask the user for their Gmail if needed.",
              inputSchema: z.object({
                email: z
                  .string()
                  .email()
                  .describe("The user's Gmail address (e.g. user@gmail.com)"),
              }),
            },
            generateDocument: {
              description:
                "Generate a formal document like a Product Brief or PRD. REQUIRES: setEmail must be called first if user email is not set. Call this when you have enough information to create a document.",
              inputSchema: z.object({
                type: z
                  .enum(["brief", "prd", "spec"])
                  .describe("The type of document to generate"),
                title: z.string().describe("The document title"),
              }),
            },
            completeTask: {
              description:
                "Mark a task as complete when the user indicates they have finished a task.",
              inputSchema: z.object({
                taskName: z
                  .string()
                  .describe("The name or description of the completed task"),
              }),
            },
          },
        });

        // Stream both text and tool calls
        for await (const part of result.fullStream) {
          switch (part.type) {
            case "text-delta":
              controller.enqueue(
                encoder.encode(formatSSE({ type: "text", content: part.text }))
              );
              break;

            case "tool-call":
              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "tool_call",
                    content: "",
                    toolCall: {
                      name: part.toolName as
                        | "setProject"
                        | "setEmail"
                        | "generateDocument"
                        | "completeTask",
                      args: part.input as Record<string, unknown>,
                    },
                  })
                )
              );
              break;
          }
        }

        // Send complete event
        controller.enqueue(
          encoder.encode(formatSSE({ type: "complete", content: "" }))
        );
      } catch (error) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "text",
              content: "Sorry, something went wrong. Please try again.",
            })
          )
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
