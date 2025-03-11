import { ChatMessageProps } from "../../components/ChatMessage/types";
import { MessageGroupType } from "../../components/MessageGroup/types";

interface MessageGroup {
  type: MessageGroupType;
  messages: ChatMessageProps[];
}

export const groupMessages = (messages: ChatMessageProps[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message) => {
    // Determinar o tipo do grupo com base no tipo da mensagem
    let groupType: MessageGroupType = "mixed";

    switch (message.type) {
      case "query":
        groupType = "user";
        break;
      case "reflect":
      case "thinking":
        groupType = "thinking";
        break;
      case "progress":
      case "search":
      case "visit":
        groupType = "progress";
        break;
      case "answer":
        groupType = "answer";
        break;
      case "error":
        groupType = "error";
        break;
      case "connected":
      case "step":
        groupType = "system";
        break;
      default:
        groupType = "mixed";
    }

    // Se não houver grupo atual ou o tipo for diferente, criar novo grupo
    if (!currentGroup || currentGroup.type !== groupType) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        type: groupType,
        messages: [message],
      };
    } else {
      // Adicionar mensagem ao grupo atual
      currentGroup.messages.push(message);
    }
  });

  // Adicionar o último grupo se existir
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
};
