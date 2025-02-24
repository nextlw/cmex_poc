export interface ChatMessageProps {
  type: "query" | "step" | "error" | "response" | "connected" | "reflect" | "search" | "log" | "visit" | "answer";
  content: string;
  isTyping?: boolean;
  data?: {
    reasoning?: string;
    references?: any[];
    think?: string;
    urls?: string[];
  };
  step?: number;
}

export interface ChatMessageData {
  reasoning?: string;
  references?: any[];
  think?: string;
  urls?: string[];
} 