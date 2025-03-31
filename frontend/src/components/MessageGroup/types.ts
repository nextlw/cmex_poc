import { ChatMessageProps } from "../ChatMessage/types";

export type MessageGroupType =
  | "thinking"
  | "progress"
  | "answer"
  | "error"
  | "system"
  | "mixed"
  | "user";

export interface MessageGroupProps {
  messages: ChatMessageProps[];
  groupType: MessageGroupType;
  title?: string;
  isCollapsible?: boolean;
  initialExpanded?: boolean;
  modelName?: string;
}
