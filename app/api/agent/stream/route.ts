import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { StreamEvent } from "@/lib/types";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Helper to format SSE event
function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({
          model: openai("gpt-4o"),
          system: SYSTEM_PROMPT,
          prompt,
          tools: {
            setProject: {
              description:
                "Set or update the project name based on what the user wants to build. Call this when you understand what project the user is working on.",
              inputSchema: z.object({
                name: z.string().describe("A concise, descriptive project name"),
              }),
            },
            generateDocument: {
              description:
                "Generate a formal document like a Product Brief or PRD. Call this when you have enough information to create a document.",
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
