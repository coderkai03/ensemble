import { createDocument } from "@/lib/mcp/drive";
import { createList, createTask } from "@/lib/mcp/clickup";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/lib/types";

// Deterministic task list for MVP
const TASK_TEMPLATES = [
  "Write system design",
  "Finalize project proposal",
  "Set up dataset spreadsheet",
];

export async function POST(req: Request) {
  const { projectName, document }: { projectName: string; document: string } =
    await req.json();

  // Step 1: Persist document to Google Drive
  const docTitle = `${projectName} – Project Overview`;
  const { docUrl } = await createDocument(docTitle, document);

  // Step 2: Derive deterministic tasks
  const taskTitles = TASK_TEMPLATES;

  // Step 3: Create ClickUp container and tasks
  const list = await createList(projectName);

  const tasks: Task[] = await Promise.all(
    taskTitles.map(async (title) => {
      const description = `Related document: ${docUrl}`;
      const clickupTask = await createTask(list.id, title, description);

      return {
        id: uuidv4(),
        title,
        status: "todo" as const,
        clickupTaskId: clickupTask.id !== "failed" ? clickupTask.id : undefined,
      };
    })
  );

  // Step 4: Return tasks to client
  return Response.json({
    tasks,
    docUrl,
  });
}

