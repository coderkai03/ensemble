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
export type ToolCallType = "setProject" | "generateDocument" | "completeTask";

export type SetProjectArgs = {
  name: string;
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
  if (!line.startsWith("data: ")) return null;
  try {
    const json = line.slice(6); // Remove "data: " prefix
    return JSON.parse(json) as StreamEvent;
  } catch {
    return null;
  }
}
