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

