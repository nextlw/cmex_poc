import axios from "axios";

// Configuração do cliente HTTP para comunicação com a FastAPI
const httpClient = axios.create({
  baseURL: process.env.FASTAPI_URL || "http://localhost:8000",
  timeout: 30000, // 30 segundos
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para logs de requisições
httpClient.interceptors.request.use(
  (config) => {
    console.log(
      `Requisição para FastAPI: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Erro na requisição para FastAPI:", error);
    return Promise.reject(error);
  }
);

// Interceptor para logs de respostas
httpClient.interceptors.response.use(
  (response) => {
    console.log(
      `Resposta da FastAPI: ${response.status} ${response.statusText}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `Erro na resposta da FastAPI: ${error.response.status} ${error.response.statusText}`
      );
      console.error("Dados do erro:", error.response.data);
    } else if (error.request) {
      console.error(
        "Sem resposta da FastAPI. Verifique se o serviço está em execução."
      );
    } else {
      console.error("Erro na configuração da requisição:", error.message);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
