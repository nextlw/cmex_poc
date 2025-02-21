export interface Query {
  q: string;
  budget?: number;
  maxBadAttempt?: number;
  model?: "qwen2.5-7b-instruct-1m" | "gemini-2.0-flash";
}

export interface LLMOutput {
  timestamp?: string;
  type?: "progress" | "final_answer" | "error";
  data?: Record<string, any>;
}

export interface TaskResult {
  action?: string;
  answer?: string;
  references?: Array<{
    exactQuote?: string;
    url?: string;
  }>;
  think?: string;
}

export interface LogsResponse {
  serverLogs?: Array<{
    timestamp?: string;
    message?: string;
    level?: "log" | "error" | "warn" | "info";
  }>;
  promptContents?: Array<{
    filename?: string;
    content?: string;
  }>;
}
