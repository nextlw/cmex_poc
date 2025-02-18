export interface Reference {
    exactQuote: string;
    url: string;
  }
  
  export interface Message {
    type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'search' | 'log';
    content: string;
    isTyping?: boolean;
    data?: {
      think?: string;
      answer?: string;
      references?: Reference[];
      searchQuery?: string;
      questionsToAnswer?: string[];
    };
  }

  export interface Query {
    id: string;
    title: string;
    timestamp: string;
    status: 'pending' | 'completed' | 'error';
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
    type: 'progress' | 'answer' | 'error' | 'connected';
    data?: {
      action?: 'search' | 'answer' | 'reflect';
      think?: string;
      answer?: string;
      searchQuery?: string;
      references?: Reference[];
      error?: string;
    };
    trackers?: {
      tokenTracker: {
        usage: Array<{tool: string; tokens: number}>;
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