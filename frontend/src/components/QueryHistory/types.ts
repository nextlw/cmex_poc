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
  status: string;
  timestamp: string;
  summary?: string;
  question?: string;
}

export interface QueryHistoryProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
  selectedQueryId?: string;
}

export interface Message {
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'log';
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
