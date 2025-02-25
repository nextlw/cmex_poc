export interface ChatMessageProps {
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'search' | 'log' | 'visit' | 'answer';
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
  };
  step: number;
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
} 