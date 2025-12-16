/**
 * Google Workspace MCP Client
 * Uses MCP SDK to communicate with google_workspace_mcp server
 * https://github.com/taylorwilsdon/google_workspace_mcp
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const GOOGLE_MCP_URL = process.env.GOOGLE_MCP_BASE_URL || "http://localhost:8000";

export interface CreateDocumentResult {
  docId: string;
  docUrl: string;
  authRequired?: boolean;
  authUrl?: string;
}

// Singleton MCP client
let mcpClient: Client | null = null;
let isConnected = false;

/**
 * Get or create the MCP client connection
 */
async function getMcpClient(): Promise<Client> {
  if (mcpClient && isConnected) {
    return mcpClient;
  }

  const transport = new StreamableHTTPClientTransport(
    new URL(`${GOOGLE_MCP_URL}/mcp/`)
  );

  mcpClient = new Client({
    name: "ensemble",
    version: "1.0.0",
  });

  await mcpClient.connect(transport);
  isConnected = true;

  console.log("Connected to Google Workspace MCP server");
  return mcpClient;
}

/**
 * Create a document in Google Docs via MCP
 * Uses gdocs_create tool from google_workspace_mcp
 */
export async function createDocument(
  title: string,
  content: string
): Promise<CreateDocumentResult> {
  try {
    const client = await getMcpClient();

    // Call the create_doc tool
    const result = await client.callTool({
      name: "create_doc",
      arguments: {
        title,
        content,
      },
    });

    console.log("MCP create_doc result:", result);

    // Handle the result
    if (result.isError) {
      const errorContent = result.content as Array<{ type: string; text?: string }>;
      const errorText = errorContent?.[0]?.text || "Unknown error";
      
      // Check if it's an auth required response
      if (errorText.includes("auth") || errorText.includes("authorize")) {
        console.log("Google authentication required:", errorText);
        return {
          docId: "auth_required",
          docUrl: "#",
          authRequired: true,
          authUrl: errorText,
        };
      }
      
      throw new Error(errorText);
    }

    // Parse successful response
    const content_result = result.content as Array<{ type: string; text?: string }>;
    const responseText = content_result?.[0]?.text || "{}";
    
    // Try to parse as JSON, otherwise extract doc ID from text
    let docId = "unknown";
    let docUrl = "#";

    try {
      const parsed = JSON.parse(responseText);
      docId = parsed.documentId || parsed.id || parsed.docId || "unknown";
      docUrl = parsed.url || parsed.documentUrl || `https://docs.google.com/document/d/${docId}`;
    } catch {
      // If not JSON, try to extract document ID from response text
      const idMatch = responseText.match(/document[_\s]?[iI][dD][:\s]*["']?([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        docId = idMatch[1];
        docUrl = `https://docs.google.com/document/d/${docId}`;
      }
    }

    return {
      docId,
      docUrl,
    };
  } catch (error) {
    console.error("Failed to create document via MCP:", error);
    
    // Reset connection on error
    isConnected = false;
    mcpClient = null;

    return {
      docId: "failed",
      docUrl: "#",
    };
  }
}

/**
 * Close the MCP connection (call on shutdown)
 */
export async function closeMcpConnection(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    isConnected = false;
  }
}
