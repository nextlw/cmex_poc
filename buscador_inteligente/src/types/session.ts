export interface Reference {
  exactQuote: string;
  url: string;
}

export interface QueryStep {
  id: number;
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'search' | 'log' | 'visit' | 'answer';
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
    status: 'waiting' | 'processing' | 'completed';
    completed: boolean;
    active: boolean;
  };
}

export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'error';
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
} 