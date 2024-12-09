import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://pocrender-569a.onrender.com", // Base URL para todas as requisições
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.OPENAI_API_KEY}`, // Use import.meta.env para acessar variáveis de ambiente no Vite
  },
});

export default axiosInstance;
