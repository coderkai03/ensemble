/**
 * ClickUp API Client
 * Direct integration with ClickUp REST API v2
 * https://clickup.com/api
 */

const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY;
const CLICKUP_LIST_ID = process.env.CLICKUP_LIST_ID;
const CLICKUP_BASE_URL = "https://api.clickup.com/api/v2";

export interface ClickUpTask {
  id: string;
  name: string;
  url: string;
}

export interface CreateListResult {
  id: string;
  name: string;
}

/**
 * Helper to make authenticated requests to ClickUp API
 */
async function clickupFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c7e6bd35-a5b1-4d6f-b07f-8483f016588a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clickup.ts:clickupFetch',message:'ClickUp env check',data:{hasApiKey:!!CLICKUP_API_KEY,apiKeyLength:CLICKUP_API_KEY?.length,apiKeyPrefix:CLICKUP_API_KEY?.substring(0,5),listId:CLICKUP_LIST_ID},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A1-A2'})}).catch(()=>{});
  // #endregion
  if (!CLICKUP_API_KEY) {
    throw new Error("CLICKUP_API_KEY is not configured");
  }

  const url = `${CLICKUP_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: CLICKUP_API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c7e6bd35-a5b1-4d6f-b07f-8483f016588a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clickup.ts:clickupFetch',message:'ClickUp request details',data:{url,method:options.method||'GET',authHeaderSet:!!headers.Authorization,authHeaderFormat:headers.Authorization?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A3'})}).catch(()=>{});
  // #endregion

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Create a list (project container) in ClickUp
 * Note: For simplicity, we use the pre-configured CLICKUP_LIST_ID
 * This function returns a "virtual" list using the configured list
 */
export async function createList(name: string): Promise<CreateListResult> {
  // For MVP, we use a single pre-configured list
  // In production, you could create folders/lists dynamically
  if (!CLICKUP_LIST_ID) {
    console.warn("CLICKUP_LIST_ID not configured, using placeholder");
    return {
      id: "unconfigured",
      name,
    };
  }

  return {
    id: CLICKUP_LIST_ID,
    name,
  };
}

/**
 * Create a task in ClickUp
 * https://clickup.com/api/clickupreference/operation/CreateTask/
 */
export async function createTask(
  listId: string,
  name: string,
  description: string
): Promise<ClickUpTask> {
  // Use configured list if listId is placeholder
  const targetListId = listId === "unconfigured" || listId === "failed" 
    ? CLICKUP_LIST_ID 
    : listId;

  if (!targetListId) {
    console.error("No valid ClickUp list ID available");
    return {
      id: "failed",
      name,
      url: "#",
    };
  }

  try {
    const response = await clickupFetch(`/list/${targetListId}/task`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c7e6bd35-a5b1-4d6f-b07f-8483f016588a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clickup.ts:createTask',message:'ClickUp error response',data:{status:response.status,errorBody:errorText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A3-error'})}).catch(()=>{});
      // #endregion
      console.error("ClickUp create task error:", response.status, errorText);
      throw new Error(`ClickUp API returned ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      url: data.url,
    };
  } catch (error) {
    console.error("Failed to create task in ClickUp:", error);
    return {
      id: "failed",
      name,
      url: "#",
    };
  }
}

/**
 * Mark a task as complete in ClickUp
 * https://clickup.com/api/clickupreference/operation/UpdateTask/
 */
export async function completeTask(taskId: string): Promise<boolean> {
  if (!taskId || taskId === "failed") {
    return false;
  }

  try {
    const response = await clickupFetch(`/task/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "complete",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ClickUp complete task error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to complete task in ClickUp:", error);
    return false;
  }
}

/**
 * Get a task by ID (useful for verification)
 * https://clickup.com/api/clickupreference/operation/GetTask/
 */
export async function getTask(taskId: string): Promise<ClickUpTask | null> {
  if (!taskId || taskId === "failed") {
    return null;
  }

  try {
    const response = await clickupFetch(`/task/${taskId}`);

    if (!response.ok) {
      console.error("ClickUp get task error:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      url: data.url,
    };
  } catch (error) {
    console.error("Failed to get task from ClickUp:", error);
    return null;
  }
}
