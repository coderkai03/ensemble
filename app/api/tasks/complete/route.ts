import { completeTask } from "@/lib/mcp/clickup";

export async function POST(req: Request) {
  const { clickupTaskId }: { clickupTaskId: string } = await req.json();

  if (!clickupTaskId) {
    // No ClickUp task ID - still return success (UI state is source of truth)
    return Response.json({ success: true });
  }

  // Fire and forget - failures are logged only, never block UI
  const success = await completeTask(clickupTaskId);

  if (!success) {
    console.warn(`Failed to mark ClickUp task ${clickupTaskId} as complete`);
  }

  // Always return 200 - UI state is authoritative
  return Response.json({ success: true });
}

