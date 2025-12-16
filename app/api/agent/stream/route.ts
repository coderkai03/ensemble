import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are generating a project document.
Output only markdown.
Do not explain.
Do not summarize.
Do not mention tasks.
Create a comprehensive project overview document with sections for:
- Executive Summary
- Project Goals
- Key Features
- Technical Architecture
- Timeline & Milestones
- Success Metrics`;

export async function POST(req: Request) {
  const { prompt, projectName }: { prompt: string; projectName: string } =
    await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    prompt: `Project Name: ${projectName}\n\nUser Request: ${prompt}`,
  });

  return result.toTextStreamResponse();
}

