export interface ChatMessageProps {
  type:
    | "query"
    | "step"
    | "response"
    | "error"
    | "connected"
    | "reflect"
    | "search"
    | "log"
    | "visit"
    | "answer"
    | "progress"
    | "thinking";
  content: string;
  isTyping?: boolean;
  data?: {
    reasoning?: string;
    references?: any[];
    think?: string;
    urls?: string[];
    outputs?: any[];
    trackers?: any;
    questionsToAnswer?: string[];
    url?: string;
    query?: string;
    searchQuery?: string;
    content?: string;
    action?: string;
    answer?: string;
    message?: string;
    error?: string;
  };
  step?: number;
  /**
   * Nome do modelo que gerou a resposta
   */
  modelName?: string;
}

export interface ChatMessageData {
  reasoning?: string;
  references?: any[];
  think?: string;
  urls?: string[];
  questionsToAnswer?: string[];
  url?: string;
  query?: string;
  searchQuery?: string;
  content?: string;
  action?: string;
  answer?: string;
  message?: string;
  error?: string;
}
