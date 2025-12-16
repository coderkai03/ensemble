"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Task, Message, ProjectState } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// Task matching heuristics
function matchTaskFromMessage(
  message: string,
  tasks: Task[]
): Task | undefined {
  const completionPatterns = /finished|completed|done|complete/i;
  if (!completionPatterns.test(message)) return undefined;

  const lowerMessage = message.toLowerCase();
  return tasks.find(
    (task) =>
      task.status === "todo" &&
      lowerMessage.includes(task.title.toLowerCase().split(" ")[0])
  );
}

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

// Streaming Document Canvas
function DocumentCanvas({
  document,
  isStreaming,
}: {
  document: string;
  isStreaming: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && isStreaming) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
    }
  }, [document, isStreaming]);

  if (!document) return null;

  return (
    <div className="bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-sm text-zinc-400 font-medium">
          Project Document
        </span>
        {isStreaming && (
          <span className="flex items-center gap-2 text-xs text-blue-400">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot" />
            Generating...
          </span>
        )}
      </div>
      <div
        ref={canvasRef}
        className="p-6 max-h-[400px] overflow-y-auto prose prose-sm"
      >
        <ReactMarkdown>{document}</ReactMarkdown>
      </div>
    </div>
  );
}

// Chat Message Component
function ChatMessage({
  message,
  projectState,
  isStreaming,
  onTaskComplete,
  onPlayTTS,
}: {
  message: Message;
  projectState: ProjectState | null;
  isStreaming: boolean;
  onTaskComplete: (taskId: string) => void;
  onPlayTTS: (text: string) => void;
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

        {/* Show document canvas for assistant messages with document */}
        {!isUser && projectState?.document && (
          <DocumentCanvas
            document={projectState.document}
            isStreaming={isStreaming}
          />
        )}

        {/* Show tasks for assistant messages with tasks */}
        {!isUser && projectState?.tasks && projectState.tasks.length > 0 && (
          <TaskList
            projectName={projectState.projectName}
            tasks={projectState.tasks}
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

// Main Chat UI
function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle task completion
  const handleTaskComplete = useCallback(
    async (taskId: string) => {
      if (!projectState) return;

      const task = projectState.tasks.find((t) => t.id === taskId);
      if (!task || task.status === "done") return;

      // Update local state immediately
      setProjectState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "done" as const } : t
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

  // Check user messages for task completion hints
  const checkForTaskCompletion = useCallback(
    (message: string) => {
      if (!projectState?.tasks) return;

      const matchedTask = matchTaskFromMessage(message, projectState.tasks);
      if (matchedTask) {
        handleTaskComplete(matchedTask.id);
      }
    },
    [projectState, handleTaskComplete]
  );

  // Handle TTS playback
  const handlePlayTTS = useCallback(async (text: string) => {
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
  }, [audioPlaying]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !projectName.trim() || isStreaming) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
    };

    // Check for task completion in user message
    checkForTaskCompletion(userMessage.content);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Add placeholder assistant message
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "Generating your project document...",
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Initialize project state if not exists
    if (!projectState) {
      setProjectState({
        projectName: projectName.trim(),
        document: "",
        tasks: [],
      });
    }

    setIsStreaming(true);

    try {
      // Stream document generation
      const response = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          projectName: projectName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let documentContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          documentContent += chunk;

          // Update project state with streaming document
          setProjectState((prev) => ({
            projectName: prev?.projectName || projectName.trim(),
            document: documentContent,
            tasks: prev?.tasks || [],
          }));
        }
      }

      setIsStreaming(false);

      // Update assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "Here's your project document:" }
            : m
        )
      );

      // Orchestrate: persist document and create tasks
      setIsOrchestrating(true);

      const completeResponse = await fetch("/api/agent/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          document: documentContent,
        }),
      });

      if (completeResponse.ok) {
        const { tasks, docUrl } = await completeResponse.json();

        setProjectState((prev) => ({
          projectName: prev?.projectName || projectName.trim(),
          document: prev?.document || documentContent,
          tasks,
        }));

        // Add orchestration summary message
        const summaryMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `I've saved your document${docUrl !== "#" ? ` to Google Drive` : ""} and created ${tasks.length} tasks to get started. You can mark tasks complete by clicking them or saying "finished [task name]" in chat.`,
        };
        setMessages((prev) => [...prev, summaryMessage]);
      }

      setIsOrchestrating(false);
    } catch (error) {
      console.error("Error:", error);
      setIsStreaming(false);
      setIsOrchestrating(false);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
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
              Your AI project manager. Enter a project name and describe what
              you want to build. I&apos;ll generate a project document and create
              actionable tasks for you.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                projectState={
                  message.role === "assistant" &&
                  index === messages.findIndex((m) => m.role === "assistant")
                    ? projectState
                    : null
                }
                isStreaming={
                  isStreaming &&
                  index === messages.length - 2 &&
                  message.role === "assistant"
                }
                onTaskComplete={handleTaskComplete}
                onPlayTTS={handlePlayTTS}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Project name input */}
          {!projectState && (
            <div className="mb-3">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name..."
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          {/* Message input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                projectState
                  ? "Message Ensemble..."
                  : "Describe your project..."
              }
              disabled={isStreaming || isOrchestrating}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={
                !input.trim() ||
                !projectName.trim() ||
                isStreaming ||
                isOrchestrating
              }
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            >
              {isStreaming || isOrchestrating ? (
                <span className="w-5 h-5 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>

          {/* Status indicator */}
          {(isStreaming || isOrchestrating) && (
            <p className="mt-2 text-xs text-zinc-500 text-center">
              {isStreaming
                ? "Streaming document..."
                : "Saving to Drive & creating tasks..."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return <ChatUI />;
}
