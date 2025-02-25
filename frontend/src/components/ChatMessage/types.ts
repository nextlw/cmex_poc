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
  };
  step: number;
}

export interface ChatMessageData {
  reasoning?: string;
  references?: any[];
  think?: string;
  urls?: string[];
} 