export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'error';
  question: string;
}

export interface QueryHistoryItem {
  id: string;
  title: string;
  question?: string;
  summary?: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: string;
  references?: Reference[];
}

export interface QueryHistoryProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
  selectedQueryId?: string;
}

export interface Message {
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'search' | 'log' | 'visit';
  content: string;
  isTyping?: boolean;
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
  type: 'progress' | 'answer' | 'error' | 'connected' | 'status';
  data?: {
    action?: 'search' | 'answer' | 'reflect';
    think?: string;
    answer?: string;
    searchQuery?: string;
    references?: Reference[];
    questionsToAnswer?: string[];
    status?: 'error' | 'completed';
  };
  trackers?: {
    tokenTracker: {
      usage: Array<{tool: string; tokens: number}>;
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
