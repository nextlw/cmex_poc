import React, { useState } from "react";
import { sendChatMessage } from "../services/api";

interface ChatProps {
  // Adicione props conforme necessário
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const Chat: React.FC<ChatProps> = () => {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt4");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Adicionar mensagem do usuário à conversa
    const userMessage: Message = { role: "user", content: message };
    setConversation((prev) => [...prev, userMessage]);

    // Limpar input e mostrar loading
    setMessage("");
    setLoading(true);

    try {
      // Enviar mensagem diretamente para o Node.js
      const response = await sendChatMessage(message, model);

      if (response.success) {
        // Adicionar resposta à conversa
        setConversation((prev) => [
          ...prev,
          { role: "assistant", content: response.response },
        ]);
      } else {
        // Adicionar mensagem de erro
        setConversation((prev) => [
          ...prev,
          { role: "system", content: "Erro ao processar mensagem" },
        ]);
      }
    } catch (error) {
      // Adicionar mensagem de erro
      setConversation((prev) => [
        ...prev,
        { role: "system", content: "Erro ao conectar ao servidor" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="model-select"
        >
          <option value="gpt4">GPT-4</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="local">Modelo Local</option>
        </select>
      </div>

      <div className="chat-messages">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.role === "user" ? "user-message" : "assistant-message"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="message assistant-message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={loading}
        />

        <button
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat;
