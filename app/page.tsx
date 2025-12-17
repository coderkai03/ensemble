"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type {
  Task,
  Message,
  ProjectState,
  SetProjectArgs,
  GenerateDocumentArgs,
  CompleteTaskArgs,
} from "@/lib/types";
import { parseStreamEvent } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// Icons
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function SquareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function VolumeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}

function FolderIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function DocumentIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CloseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// Task List Component
function TaskList({
  projectName,
  tasks,
  onTaskComplete,
}: {
  projectName: string;
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
}) {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 mt-4">
      <div className="flex items-center gap-2 text-zinc-300 mb-3">
        <FolderIcon className="w-4 h-4" />
        <span className="font-medium">Project: {projectName}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => task.status === "todo" && onTaskComplete(task.id)}
            className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
              task.status === "done"
                ? "text-zinc-500 line-through"
                : "text-zinc-200 hover:bg-zinc-800/50 cursor-pointer"
            }`}
            disabled={task.status === "done"}
          >
            {task.status === "done" ? (
              <span className="text-emerald-500">
                <CheckIcon className="w-4 h-4" />
              </span>
            ) : (
              <span className="text-zinc-500">
                <SquareIcon className="w-4 h-4" />
              </span>
            )}
            <span>{task.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Canvas Panel Component (ChatGPT-style side panel)
function CanvasPanel({
  document,
  projectName,
  isStreaming,
  isOpen,
  onClose,
}: {
  document: string;
  projectName: string;
  isStreaming: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && isStreaming) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
    }
  }, [document, isStreaming]);

  return (
    <div
      className={`canvas-panel ${isOpen ? "canvas-panel-open" : "canvas-panel-closed"}`}
    >
      <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <DocumentIcon className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-zinc-200">
              {projectName || "Project Document"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isStreaming && (
              <span className="flex items-center gap-2 text-xs text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot" />
                Generating...
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Content */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-y-auto p-6 prose prose-sm"
        >
          {document ? (
            <ReactMarkdown>{document}</ReactMarkdown>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
              <DocumentIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>Your document will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chat Message Component
function ChatMessage({
  message,
  tasks,
  projectName,
  onTaskComplete,
  onPlayTTS,
  isStreaming,
}: {
  message: Message;
  tasks?: Task[];
  projectName?: string;
  onTaskComplete: (taskId: string) => void;
  onPlayTTS: (text: string) => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3"
            : "bg-zinc-800/50 text-zinc-100 rounded-2xl rounded-bl-md px-4 py-3"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Show tasks for assistant messages with tasks */}
        {!isUser && tasks && tasks.length > 0 && projectName && (
          <TaskList
            projectName={projectName}
            tasks={tasks}
            onTaskComplete={onTaskComplete}
          />
        )}

        {/* TTS button for assistant messages */}
        {!isUser && !isStreaming && message.content.length > 0 && (
          <button
            onClick={() => onPlayTTS(message.content)}
            className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <VolumeIcon className="w-3.5 h-3.5" />
            Listen
          </button>
        )}
      </div>
    </div>
  );
}

// Tool call handlers type
type ToolCallHandlers = {
  onSetProject: (args: SetProjectArgs) => void;
  onGenerateDocument: (args: GenerateDocumentArgs) => void;
  onCompleteTask: (args: CompleteTaskArgs) => void;
};

// Main Chat UI
function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle task completion (called by UI click or by agent tool call)
  const handleTaskComplete = useCallback(
    async (taskIdOrName: string) => {
      if (!projectState) return;

      // Find task by ID or by name
      const task = projectState.tasks.find(
        (t) =>
          t.id === taskIdOrName ||
          t.title.toLowerCase().includes(taskIdOrName.toLowerCase())
      );
      if (!task || task.status === "done") return;

      // Update local state immediately
      setProjectState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id ? { ...t, status: "done" as const } : t
          ),
        };
      });

      // Fire background request to backend (non-blocking)
      if (task.clickupTaskId) {
        fetch("/api/tasks/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickupTaskId: task.clickupTaskId }),
        }).catch(console.error);
      }
    },
    [projectState]
  );

  // Handle TTS playback
  const handlePlayTTS = useCallback(
    async (text: string) => {
      if (audioPlaying) return;

      setAudioPlaying(true);
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          console.log("TTS not available");
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      } catch (error) {
        console.error("TTS playback error:", error);
        setAudioPlaying(false);
      }
    },
    [audioPlaying]
  );

  // Stream and process response with tool calls
  const streamWithToolCalls = async (
    response: Response,
    onText: (content: string) => void,
    onDocument: (content: string) => void,
    toolHandlers: ToolCallHandlers
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const event = parseStreamEvent(line);
          if (!event) continue;

          switch (event.type) {
            case "text":
              onText(event.content);
              break;

            case "document":
              onDocument(event.content);
              break;

            case "tool_call":
              if (event.toolCall) {
                switch (event.toolCall.name) {
                  case "setProject":
                    toolHandlers.onSetProject(
                      event.toolCall.args as SetProjectArgs
                    );
                    break;
                  case "generateDocument":
                    toolHandlers.onGenerateDocument(
                      event.toolCall.args as GenerateDocumentArgs
                    );
                    break;
                  case "completeTask":
                    toolHandlers.onCompleteTask(
                      event.toolCall.args as CompleteTaskArgs
                    );
                    break;
                }
              }
              break;

            case "complete":
              // Stream complete
              break;
          }
        }
      }
    }
  };

  // Generate document via dedicated endpoint
  const generateDocument = async (
    args: GenerateDocumentArgs,
    projectName: string,
    conversationContext: string
  ) => {
    setIsGeneratingDoc(true);
    setCanvasOpen(true);

    let documentContent = "";

    try {
      const response = await fetch("/api/agent/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a ${args.type} document titled "${args.title}"`,
          projectName,
          conversationContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Document generation failed");
      }

      await streamWithToolCalls(
        response,
        () => {}, // No text expected
        (content) => {
          documentContent += content;
          setProjectState((prev) => ({
            projectName: prev?.projectName || projectName,
            document: documentContent,
            tasks: prev?.tasks || [],
          }));
        },
        {
          onSetProject: () => {},
          onGenerateDocument: () => {},
          onCompleteTask: () => {},
        }
      );
    } catch (error) {
      console.error("Document generation error:", error);
    } finally {
      setIsGeneratingDoc(false);
    }

    return documentContent;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userPrompt = input.trim();
    setInput("");

    // Add placeholder assistant message
    const assistantMessageId = uuidv4();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    setIsStreaming(true);
    let chatContent = "";
    let currentProjectName = projectState?.projectName || "";
    let pendingDocumentArgs: GenerateDocumentArgs | null = null;

    try {
      const response = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      await streamWithToolCalls(
        response,
        // onText: append to chat message
        (content) => {
          chatContent += content;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: chatContent } : m
            )
          );
        },
        // onDocument: not expected in main chat stream
        () => {},
        // Tool handlers
        {
          onSetProject: (args) => {
            currentProjectName = args.name;
            setProjectState((prev) => ({
              projectName: args.name,
              document: prev?.document || "",
              tasks: prev?.tasks || [],
            }));
          },
          onGenerateDocument: (args) => {
            // Store for later - we'll generate after streaming completes
            pendingDocumentArgs = args;
          },
          onCompleteTask: (args) => {
            handleTaskComplete(args.taskName);
          },
        }
      );

      // Remove empty assistant message if no content
      if (!chatContent.trim()) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      }

      setIsStreaming(false);

      // Generate document if tool was called
      if (pendingDocumentArgs && currentProjectName) {
        const docContent = await generateDocument(
          pendingDocumentArgs,
          currentProjectName,
          chatContent
        );

        // Orchestrate: persist document and create tasks
        if (docContent) {
          const completeResponse = await fetch("/api/agent/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectName: currentProjectName,
              document: docContent,
            }),
          });

          if (completeResponse.ok) {
            const result = await completeResponse.json();

            if (result.authRequired && result.authUrl) {
              setMessages((prev) => [
                ...prev,
                { id: uuidv4(), role: "assistant", content: result.authUrl },
              ]);
            }

            setProjectState((prev) => ({
              projectName: prev?.projectName || currentProjectName,
              document: prev?.document || docContent,
              tasks: result.tasks || [],
            }));

            const tasksCount = result.tasks?.length || 0;
            if (tasksCount > 0) {
              setMessages((prev) => [
                ...prev,
                {
                  id: uuidv4(),
                  role: "assistant",
                  content: result.authRequired
                    ? "Please authorize Google access using the link above, then try again."
                    : `I've saved your document${result.docUrl !== "#" ? " to Google Drive" : ""} and created ${tasksCount} tasks to get started.`,
                },
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsStreaming(false);
      setIsGeneratingDoc(false);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    }
  };

  // Find the message that should show tasks (last assistant message with tasks)
  const lastAssistantWithTasks = projectState?.tasks?.length
    ? messages.findLast((m) => m.role === "assistant")?.id
    : null;

  const isProcessing = isStreaming || isGeneratingDoc;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat Panel */}
      <div
        className={`chat-panel ${canvasOpen ? "chat-panel-with-canvas" : "chat-panel-full"}`}
      >
        <div className="flex flex-col h-full max-w-3xl mx-auto">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FolderIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                  Welcome to Ensemble
                </h2>
                <p className="text-zinc-400 max-w-md mb-8">
                  Your AI project manager. Tell me what you want to build and
                  I&apos;ll help you plan, document, and execute.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    tasks={
                      message.id === lastAssistantWithTasks
                        ? projectState?.tasks
                        : undefined
                    }
                    projectName={
                      message.id === lastAssistantWithTasks
                        ? projectState?.projectName
                        : undefined
                    }
                    onTaskComplete={handleTaskComplete}
                    onPlayTTS={handlePlayTTS}
                    isStreaming={isStreaming}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-4">
            <form onSubmit={handleSubmit}>
              {/* Message input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want to build..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  {isProcessing ? (
                    <span className="w-5 h-5 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>

              {/* Status indicator */}
              {isProcessing && (
                <p className="mt-2 text-xs text-zinc-500 text-center">
                  {isGeneratingDoc ? "Generating document..." : "Thinking..."}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Canvas Panel */}
      <CanvasPanel
        document={projectState?.document || ""}
        projectName={projectState?.projectName || "New Project"}
        isStreaming={isGeneratingDoc}
        isOpen={canvasOpen}
        onClose={() => setCanvasOpen(false)}
      />

      {/* Canvas Toggle Button (when closed) */}
      {!canvasOpen && projectState?.document && (
        <button
          onClick={() => setCanvasOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 transition-colors shadow-lg"
          title="Open document"
        >
          <DocumentIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return <ChatUI />;
}
