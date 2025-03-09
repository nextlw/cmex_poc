import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";
const NODE_API_URL =
  process.env.REACT_APP_NODE_API_URL || "http://localhost:3000";

// Função para enviar consulta
export async function sendQuery(query: string, model: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/query`, {
      query,
      model,
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar consulta:", error);
    throw error;
  }
}

// Função para verificar status da consulta
export async function checkQueryStatus(requestId: string) {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/query-status/${requestId}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    throw error;
  }
}

// Função para configurar SSE (Server-Sent Events)
export function setupSSE(requestId: string, onMessage: (data: any) => void) {
  const eventSource = new EventSource(
    `${NODE_API_URL}/api/v1/stream/${requestId}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Erro ao processar evento SSE:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("Erro na conexão SSE:", error);
    eventSource.close();
  };

  return {
    close: () => eventSource.close(),
  };
}

// Função para chat direto com o Node.js
export async function sendChatMessage(message: string, model: string) {
  try {
    const response = await axios.post(`${NODE_API_URL}/api/v1/chat`, {
      message,
      model,
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem de chat:", error);
    throw error;
  }
}
