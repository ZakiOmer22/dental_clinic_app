// ══════════════════════════════════════════════════════════════════════════════
// AI AGENT TYPES & CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export type AgentRole = 
  | "appointment" 
  | "patient" 
  | "clinical" 
  | "analytics" 
  | "admin" 
  | "general";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentType?: AgentRole;
  functionCalls?: FunctionCall[];
  metadata?: Record<string, any>;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface Agent {
  id: AgentRole;
  name: string;
  description: string;
  icon: any;
  color: string;
  systemPrompt: string;
  functions: AgentFunction[];
}

export interface AgentFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export interface ChatState {
  messages: Message[];
  currentAgent: AgentRole;
  isLoading: boolean;
  error: string | null;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}