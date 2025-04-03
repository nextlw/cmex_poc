import axios from "axios";
import { supabase } from "./auth/SupabaseClient";

// Ambiente
const ENV = import.meta.env.ENV || "dev";

// Define a URL base para as requisições do Axios
const baseURL =
  ENV === "dev"
    ? "http://localhost:10000/api"
    : ENV === "prod"
    ? "https://cmex-poc.onrender.com/api"
    : ENV === "staging"
    ? "https://cmex-poc-amrt.onrender.com/api"
    : ENV === "homolog"
    ? "https://cmex-back-homolog.onrender.com/api"
    : "";

// Chave do localStorage do Supabase
const SUPABASE_TOKEN_KEY = "sb-qrfxqaovpddcziulqflw-auth-token";

// Função para obter o token do localStorage
const getTokenFromLocalStorage = () => {
  const tokenStr = localStorage.getItem(SUPABASE_TOKEN_KEY);
  if (!tokenStr) return null;

  try {
    return JSON.parse(tokenStr);
  } catch (error) {
    console.error("Erro ao processar token:", error);
    return null;
  }
};

// Função para renovar o token
const refreshToken = async () => {
  try {
    console.log("Tentando renovar o token...");
    const storedSession = getTokenFromLocalStorage();

    if (!storedSession?.refresh_token) {
      console.error("Não foi possível renovar: refresh_token não encontrado");
      return null;
    }

    // Tenta renovar o token usando o refresh_token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: storedSession.refresh_token,
    });

    if (error || !data?.session) {
      console.error("Erro ao renovar token:", error);
      return null;
    }

    // Atualiza o token no localStorage
    localStorage.setItem(SUPABASE_TOKEN_KEY, JSON.stringify(data.session));
    console.log("Token renovado com sucesso!");

    return data.session;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return null;
  }
};

// Cria uma instância do Axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 120000,
  withCredentials: true, // Importante para CORS com credenciais
});

// Intercepta as requisições
axiosInstance.interceptors.request.use((config) => {
  // Obter o token do localStorage
  const token = getTokenFromLocalStorage();

  // Adiciona o token no header dos chamados
  if (token?.access_token) {
    config.headers.Authorization = `Bearer ${token.access_token}`;
    console.log(
      "Token adicionado:",
      token.access_token.substring(0, 10) + "..."
    );
  } else {
    console.warn("Token não encontrado ou inválido");
  }

  // Define o tipo de dados passado nas requisições
  config.headers["Content-Type"] = "application/json";

  return config;
});

// Intercepta as respostas para renovar token expirado
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se for erro 401 (não autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Token expirado detectado. Tentando renovar...");

      // Marca a requisição para não tentar renovar novamente (evita loop infinito)
      originalRequest._retry = true;

      // Tenta renovar o token
      const newSession = await refreshToken();

      if (newSession?.access_token) {
        // Atualiza o token na requisição original
        originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`;

        // Tenta a requisição novamente com o novo token
        return axiosInstance(originalRequest);
      }
    }

    // Log detalhado para debugging
    console.error("Erro na requisição:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;
