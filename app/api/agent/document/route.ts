import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { StreamEvent } from "@/lib/types";
import { DOCUMENT_PROMPT } from "@/lib/systemPrompt";

// Allow streaming responses up to 60 seconds for document generation
export const maxDuration = 60;

// Helper to format SSE event
function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const {
    prompt,
    projectName,
    conversationContext,
  }: {
    prompt: string;
    projectName: string;
    conversationContext?: string;
  } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send status that document generation is starting
      controller.enqueue(
        encoder.encode(
          formatSSE({ type: "status", content: "Generating document..." })
        )
      );

      try {
        const result = streamText({
          model: openai("gpt-4o"),
          system: DOCUMENT_PROMPT,
          prompt: `Project Name: ${projectName}

${conversationContext ? `Conversation Context:\n${conversationContext}\n\n` : ""}User Request: ${prompt}

Generate a comprehensive document for this project based on the information provided.`,
        });

        // Stream all chunks as document content
        for await (const chunk of result.textStream) {
          controller.enqueue(
            encoder.encode(formatSSE({ type: "document", content: chunk }))
          );
        }

        // Send completion status
        controller.enqueue(
          encoder.encode(
            formatSSE({ type: "status", content: "Document generated" })
          )
        );

        // Send complete event
        controller.enqueue(
          encoder.encode(formatSSE({ type: "complete", content: "" }))
        );
      } catch (error) {
        console.error("Document stream error:", error);
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "status",
              content: "Failed to generate document. Please try again.",
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

