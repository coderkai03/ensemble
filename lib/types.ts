export type Task = {
  id: string;
  title: string;
  status: "todo" | "done";
  clickupTaskId?: string;
};

export type ProjectState = {
  projectName: string;
  document: string;
  tasks: Task[];
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Tool call types
export type ToolCallType = "setProject" | "setEmail" | "generateDocument" | "completeTask";

export type SetProjectArgs = {
  name: string;
};

export type SetEmailArgs = {
  email: string;
};

export type GenerateDocumentArgs = {
  type: "brief" | "prd" | "spec";
  title: string;
};

export type CompleteTaskArgs = {
  taskName: string;
};

// Stream event types for structured SSE streaming
export type StreamEventType = "text" | "document" | "tool_call" | "status" | "complete";

export type StreamEvent = {
  type: StreamEventType;
  content: string;
  toolCall?: {
    name: ToolCallType;
    args: Record<string, unknown>;
  };
};

// Helper to parse SSE data lines
export function parseStreamEvent(line: string): StreamEvent | null {
  // Be robust to different line endings / extra whitespace (e.g. "\r\n")
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;
  try {
    const json = trimmed.slice(6); // Remove "data: " prefix
    return JSON.parse(json) as StreamEvent;
  } catch {
    return null;
  }
}
