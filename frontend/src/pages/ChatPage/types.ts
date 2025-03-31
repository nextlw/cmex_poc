export interface Reference {
  exactQuote: string;
  url: string;
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
  data?: {
    think?: string;
    answer?: string;
    reasoning?: string;
    references?: Reference[];
    searchQuery?: string;
    questionsToAnswer?: string[];
    urls?: string[];
    outputs?: any[];
    trackers?: any;
    message?: string;
    error?: string;
  };
  step?: number;
}

export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: "in_progress" | "completed" | "error";
  question: string;
}

export interface AgentState {
  selectedQueryId?: string;
  question?: string;
  messages: Message[];
  finalResult?: any;
  queries?: Query[];
  trackers?: {
    tokenUsage: number;
    actionState: {
      action: string;
      totalStep: number;
      badAttempts: number;
    };
  };
}

export interface StreamMessage {
  type: "progress" | "answer" | "error" | "connected";
  data?: {
    action?: "search" | "answer" | "reflect";
    think?: string;
    answer?: string;
    searchQuery?: string;
    references?: Reference[];
    error?: string;
  };
  trackers?: {
    tokenTracker: {
      usage: Array<{ tool: string; tokens: number }>;
      totalTokens: number;
    };
    actionTracker: {
      think: string;
      action: string;
      totalStep: number;
      badAttempts: number;
    };
  };
}

export type StepType = string;

export type MessageType =
  | "query"
  | "step"
  | "error"
  | "response"
  | "connected"
  | "reflect"
  | "search"
  | "log"
  | "visit"
  | "answer"
  | "progress";

export interface ActionItem {
  type: StepType;
  title: string;
  completed: boolean;
  active: boolean;
  status: "waiting" | "processing" | "completed";
  urls?: string[];
}

export interface ActionIconProps {
  type: StepType;
}

export interface ActionStatusProps {
  status: ActionItem["status"];
}

export interface ActionListProps {
  actions: ActionItem[];
  onActionClick: (index: number) => void;
  startTime?: Date;
  urlCount?: number;
  query?: string;
  activeActionIndex: number;
  setActiveActionIndex: (index: number) => void;
}

export interface ProcessingContentProps {
  step: StepType;
  query?: string;
}
