import axios from "axios";

// Verifica se estamos em ambiente local
const isLocal =
  typeof window !== "undefined" && window.location.hostname === "localhost";

// Força o uso da API local para testes
const baseURL = "http://localhost:8000";
// Configuração original comentada
// const baseURL = isLocal
//   ? "http://localhost:8000"
//   : "https://pocrender-569a.onrender.com";

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
