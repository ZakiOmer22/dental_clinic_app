// ══════════════════════════════════════════════════════════════════════════════
// GEMINI AI SERVICE – Production | Auth via useAuthStore | v2.0.0
// ══════════════════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI, FunctionDeclaration, Tool } from "@google/generative-ai";
import { Agent, Message, AgentRole, FunctionCall } from "../ai/types";
import { getAgent } from "../ai/agents";
import { useAuthStore } from "@/app/store";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const MODEL = "gemini-flash-latest";

// ══════════════════════════════════════════════════════════════════════════════
// AUTH HELPERS – Single source: useAuthStore
// ══════════════════════════════════════════════════════════════════════════════

function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

function getCurrentUser() {
  return useAuthStore.getState().user;
}

/**
 * Attempt to refresh the access token.
 * This assumes your backend has a /auth/refresh endpoint that accepts a refresh token.
 * If not implemented, this will throw and the user will be prompted to log in again.
 */
async function refreshAccessToken(): Promise<string> {
  // Retrieve refresh token from wherever you store it.
  // If you don't store it, this will fail (as expected).
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().setAuth(null, null);
      localStorage.removeItem('refreshToken');
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Failed to refresh authentication');
  }

  const data = await response.json();
  const newToken = data.accessToken || data.token;
  if (!newToken) {
    throw new Error('Invalid refresh response');
  }

  // Update the store and localStorage
  const user = getCurrentUser();
  if (user) {
    useAuthStore.getState().setAuth(newToken, user);
  }
  localStorage.setItem('token', newToken);
  return newToken;
}

/**
 * Make an authenticated request. Automatically retries once with a refreshed token on 401.
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const doFetch = (accessToken: string) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await doFetch(token);

  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await doFetch(token);
    } catch (refreshError) {
      throw refreshError;
    }
  }

  return response;
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION CHECK
// ══════════════════════════════════════════════════════════════════════════════

async function checkAILimits(): Promise<{ allowed: boolean; message?: string }> {
  try {
    const response = await authenticatedFetch(
      `${import.meta.env.VITE_API_URL}/api/v1/subscriptions/current`
    );
    const data = await response.json();

    const features = data.features || [];
    const hasAIAccess = features.includes('ai_assistant') ||
                        features.includes('unlimited_everything') ||
                        features.includes('ai_assistant_limited');

    if (!hasAIAccess) {
      return {
        allowed: false,
        message: "AI Assistant requires a Pro or Enterprise subscription. Please upgrade your plan.",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Subscription check failed:', error);
    // Fail open – adjust based on business requirements
    return { allowed: true };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA SANITIZATION
// ══════════════════════════════════════════════════════════════════════════════

const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{16}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
];

function sanitizeMessageForGemini(text: string): string {
  let sanitized = text;
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  return sanitized;
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOLS CONVERSION
// ══════════════════════════════════════════════════════════════════════════════

function convertToGeminiTools(agent: Agent): Tool[] {
  if (agent.functions.length === 0) return [];
  const functionDeclarations: FunctionDeclaration[] = agent.functions.map((fn) => ({
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters as any,
  }));
  return [{ functionDeclarations }];
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Send message to agent
// ══════════════════════════════════════════════════════════════════════════════

export async function sendMessageToAgent(
  messages: Message[],
  agentRole: AgentRole,
  onStream?: (text: string) => void
): Promise<Message> {
  const token = getAuthToken();
  if (!token) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "⚠️ **Authentication Required**\n\nPlease log in to use the AI assistant.",
      timestamp: new Date(),
      agentType: agentRole,
    };
  }

  const limitCheck = await checkAILimits();
  if (!limitCheck.allowed) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: `⚠️ **Subscription Required**\n\n${limitCheck.message}`,
      timestamp: new Date(),
      agentType: agentRole,
    };
  }

  const agent = getAgent(agentRole);
  const tools = convertToGeminiTools(agent);

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: agent.systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
    });

    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

    const sanitizedUserMessage = sanitizeMessageForGemini(lastUserMessage.content);
    const history = buildGeminiHistory(messages.slice(0, -1));
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(sanitizedUserMessage);
    const response = result.response;

    let fullResponse = "";
    const functionCalls: FunctionCall[] = [];

    const geminiFunctionCalls = response.functionCalls();

    if (geminiFunctionCalls && geminiFunctionCalls.length > 0) {
      for (const call of geminiFunctionCalls) {
        const functionCall: FunctionCall = {
          name: call.name,
          arguments: call.args as Record<string, any>,
        };

        const agentFunction = agent.functions.find((f) => f.name === call.name);
        if (agentFunction) {
          try {
            const result = await agentFunction.handler(call.args);
            functionCall.result = result;
            functionCalls.push(functionCall);
          } catch (error: any) {
            console.error(`Error executing ${call.name}:`, error);
            functionCall.result = {
              status: "error",
              error: error.message,
              summary: `Error: ${error.message}`,
            };
            functionCalls.push(functionCall);
          }
        }
      }

      if (functionCalls.length > 0) {
        try {
          const functionResponseParts = functionCalls.map(fc => ({
            functionResponse: {
              name: fc.name,
              response: {
                status: fc.result?.status || "completed",
                data: fc.result?.data || null,
                summary: fc.result?.summary || "",
                error: fc.result?.error || null,
              },
            },
          }));

          const finalResult = await chat.sendMessage(functionResponseParts);
          const finalResponse = finalResult.response;
          const finalText = finalResponse.text();

          if (finalText && finalText !== "I've processed your request.") {
            fullResponse = finalText;
            onStream?.(finalText);
          } else {
            fullResponse = buildResponseFromFunctionCalls(functionCalls);
          }
        } catch (e) {
          console.warn("Could not get final response from Gemini:", e);
          fullResponse = buildResponseFromFunctionCalls(functionCalls);
        }
      }
    } else {
      fullResponse = response.text();
      onStream?.(fullResponse);
    }

    const authError = functionCalls.find(fc => fc.result?.authRequired || fc.result?.permissionDenied);
    if (authError) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `⚠️ **${authError.result?.error || "Access Denied"}**\n\n${authError.result?.summary || ""}`,
        timestamp: new Date(),
        agentType: agentRole,
      };
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: fullResponse || "I couldn't process that request.",
      timestamp: new Date(),
      agentType: agentRole,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);

    if (error.message?.includes('Session expired') || error.message?.includes('Not authenticated')) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "⚠️ **Session Expired**\n\nYour login session has expired. Please log in again to continue using the AI assistant.",
        timestamp: new Date(),
        agentType: agentRole,
      };
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: `❌ **Error**: ${error.message || "Unknown error occurred"}`,
      timestamp: new Date(),
      agentType: agentRole,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function buildResponseFromFunctionCalls(functionCalls: FunctionCall[]): string {
  let response = "";

  for (const fc of functionCalls) {
    const result = fc.result;

    if (result?.status === "error") {
      response += `❌ **Error**: ${result.error || "Failed to complete request"}\n\n`;
      continue;
    }

    if (result?.summary) {
      response += `${result.summary}\n\n`;
    }

    if (result?.data) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        response += `**Found ${result.data.length} result(s):**\n`;
        result.data.slice(0, 5).forEach((item: any, i: number) => {
          response += `\n${i + 1}. **${item.full_name || item.patientName || item.name || `Item ${i + 1}`}**`;
          if (item.phone) response += ` - 📞 ${item.phone}`;
          if (item.email) response += ` - ✉️ ${item.email}`;
          if (item.date_of_birth) response += ` - 🎂 ${item.date_of_birth}`;
        });
        if (result.data.length > 5) {
          response += `\n\n*...and ${result.data.length - 5} more results*`;
        }
      } else if (typeof result.data === "object" && Object.keys(result.data).length > 0) {
        response += `**Details:**\n`;
        Object.entries(result.data).forEach(([key, value]) => {
          if (value && typeof value !== "object") {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            response += `- **${formattedKey}**: ${value}\n`;
          }
        });
      }
      response += "\n";
    }
  }

  return response || "Request completed.";
}

function buildGeminiHistory(messages: Message[]): any[] {
  const history: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === "user") {
      history.push({
        role: "user",
        parts: [{ text: sanitizeMessageForGemini(msg.content) }],
      });
    } else if (msg.role === "assistant") {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.functionCalls && msg.functionCalls.length > 0) {
        for (const call of msg.functionCalls) {
          parts.push({
            functionCall: {
              name: call.name,
              args: call.arguments,
            },
          });
        }
      }

      if (parts.length > 0) {
        history.push({
          role: "model",
          parts,
        });
      }
    }
  }

  while (history.length > 0 && history[0].role !== "user") {
    history.shift();
  }

  return history;
}

export async function routeToAgent(userMessage: string): Promise<AgentRole> {
  const routingPrompt = `You are an AI router for a dental clinic system. Based on the user's message, determine which specialized agent should handle it.

Available agents:
- appointment: Scheduling, viewing appointments, sending reminders
- patient: Patient records, history, contact info, balance queries
- clinical: Treatments, prescriptions, dental charts, procedures
- analytics: Reports, statistics, revenue, business insights
- admin: Notifications, tasks, system operations, inventory
- general: General questions or unclear requests

User message: "${sanitizeMessageForGemini(userMessage)}"

Respond with ONLY the agent name (appointment, patient, clinical, analytics, admin, or general).`;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(routingPrompt);
    const response = result.response;
    const agentName = response.text().trim().toLowerCase();

    if (["appointment", "patient", "clinical", "analytics", "admin", "general"].includes(agentName)) {
      return agentName as AgentRole;
    }
  } catch (error) {
    console.error("Routing error:", error);
  }

  return "general";
}

export const QUICK_ACTIONS = [
  {
    id: "today-appointments",
    label: "Show today's appointments",
    agent: "appointment" as AgentRole,
    prompt: "Show me all appointments scheduled for today",
  },
  {
    id: "search-patient",
    label: "Find a patient",
    agent: "patient" as AgentRole,
    prompt: "Help me find a patient",
  },
  {
    id: "revenue-today",
    label: "Today's revenue",
    agent: "analytics" as AgentRole,
    prompt: "Show me today's revenue and key metrics",
  },
  {
    id: "create-task",
    label: "Create a task",
    agent: "admin" as AgentRole,
    prompt: "Help me create a task for a team member",
  },
];