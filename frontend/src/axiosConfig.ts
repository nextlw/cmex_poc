import axios from "axios"

// Ambiente
const ENV = import.meta.env.VITE_APP_NODE_ENV!

// Define a URL base para as requisições do Axios
const baseURL = ENV === "dev" 
  ? "http://localhost:10000/api"
  : "https://cmex-poc.onrender.com/api"

// Cria uma instância do Axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 120000
})

// Intercepta as requisições
axiosInstance.interceptors.request.use((config) => {
  // Chave do localStorage com o ID correto do projeto
  const SUPABASE_TOKEN = localStorage.getItem('sb-diyaxufhlpcxbevpbjsh-auth-token')

  // Adiciona o token no header dos chamados
  if (SUPABASE_TOKEN) {
    const parsedToken = JSON.parse(SUPABASE_TOKEN);
    config.headers.Authorization = `Bearer ${parsedToken.access_token}`
  }
  
  // Define o tipo de dados passado nas requisições
  config.headers["Content-Type"] = "application/json"
  
  return config
})

export default axiosInstance