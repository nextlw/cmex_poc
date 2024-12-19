import axios from "axios";

const baseURL =
  import.meta.env.VITE_APP_NODE_ENV === "development"
    ? "http://localhost:8000" // URL para ambiente de desenvolvimento
    : "https://pocrender-569a.onrender.com"; // URL para ambiente de produção

const axiosInstance = axios.create({
  baseURL, // Base URL para todas as requisições
});

axiosInstance.interceptors.request.use((config) => {
  const supabaseToken = localStorage.getItem(
    "sb-qrfxqaovpddcziulqflw-auth-token"
  );
  if (supabaseToken) {
    config.headers.Authorization = `Bearer ${JSON.parse(supabaseToken).access_token}`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

export default axiosInstance;
