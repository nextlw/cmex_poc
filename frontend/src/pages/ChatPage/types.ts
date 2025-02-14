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
    type: string;
    data: {
      message?: string;
      action?: string;
      think?: string;
      answer?: string;
      searchQuery?: string;
      references?: Reference[];
      questionsToAnswer?: string[];
      error?: string;
    };
    trackers?: {
      tokenUsage: number;
      actionState: {
        action: string;
        totalStep: number;
        badAttempts: number;
      };
    };
  }