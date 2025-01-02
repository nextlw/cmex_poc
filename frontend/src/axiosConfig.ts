import axios from "axios";

// Verifica se estamos em ambiente local
const isLocal =
  typeof window !== "undefined" && window.location.hostname === "localhost";

// Ajuste aqui para a porta correta do servidor backend
const baseURL = isLocal
  ? "http://localhost:8000" // Porta configurada no main.py
  : "https://pocrender-569a.onrender.com"; // Sua API em produção

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use((config) => {
  const supabaseToken = localStorage.getItem(
    "sb-qrfxqaovpddcziulqflw-auth-token"
  );
  if (supabaseToken) {
    config.headers.Authorization = `Bearer ${
      JSON.parse(supabaseToken).access_token
    }`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

export default axiosInstance;
