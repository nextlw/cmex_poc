import axios from "axios"

// Ambiente
const ENV = import.meta.env.VITE_APP_NODE_ENV!

// Define a URL base para as requisições do Axios
const baseURL = ENV === "development"
  ? "http://localhost:10000/api"  
  : "https://cmex-poc.onrender.com/api"  

// Cria uma instância do Axios
const axiosInstance = axios.create({
  baseURL,
})

// Intercepta as requisições
axiosInstance.interceptors.request.use((config) => {

  // ID do projeto no Supabase
  const SUPABASE_PROJECT = import.meta.env.VITE_APP_SUPABASE_PROJECT!

  // Token salvo no LocalStorage
  const SUPABASE_TOKEN = localStorage.getItem(`sb-${SUPABASE_PROJECT}-auth-token`)

  // Adiciona o token no header dos chamados
  if (SUPABASE_TOKEN) {
    config.headers.Authorization = `Bearer ${JSON.parse(SUPABASE_TOKEN).access_token}`
  }
  
  // Define o tipo de dados passado nas requisições
  config.headers["Content-Type"] = "application/json"
  
  return config
})

export default axiosInstance