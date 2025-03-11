export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: "in_progress" | "completed" | "error";
  question: string;
}

export interface QueryHistoryItem {
  id: string;
  title: string;
  question?: string;
  summary?: string;
  status: "in_progress" | "completed" | "error";
  timestamp: string;
  references?: Reference[];
  isDeleting?: boolean;
}

export interface QueryHistoryProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
  selectedQueryId?: string;
  newQuery?: QueryHistoryItem;
  onNewQueryAdded?: () => void;
}

export interface Message {
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
  step?: number;
  data?: {
    think?: string;
    answer?: string;
    references?: Reference[];
    searchQuery?: string;
    questionsToAnswer?: string[];
    reasoning?: string;
    urls?: string[];
  };
}

export interface AgentState {
  question?: string;
  messages: Message[];
  finalResult?: any;
  queries?: Query[];
}

export interface Reference {
  exactQuote: string;
  url: string;
}

export interface StreamMessage {
  type: "progress" | "answer" | "error" | "connected" | "status";
  data?: {
    action?: "search" | "answer" | "reflect";
    think?: string;
    answer?: string;
    searchQuery?: string;
    references?: Reference[];
    questionsToAnswer?: string[];
    status?: "error" | "completed";
  };
  trackers?: {
    tokenTracker: {
      usage: Array<{ tool: string; tokens: number }>;
      totalTokens: number;
    };
    actionState: {
      think: string;
      action: string;
      searchQuery?: string;
      questionsToAnswer?: string[];
    };
  };
}

export interface QueryStep {
  id: number;
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
  timestamp: string;
  data?: {
    think?: string;
    answer?: string;
    references?: Reference[];
    searchQuery?: string;
    questionsToAnswer?: string[];
    reasoning?: string;
    urls?: string[];
  };
  action?: {
    type: string;
    title: string;
    status: "waiting" | "processing" | "completed";
    completed: boolean;
    active: boolean;
  };
}

export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: "in_progress" | "completed" | "error";
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
}
