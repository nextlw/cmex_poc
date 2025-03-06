import axios from "axios"

// Ambiente
const ENV = import.meta.env.ENV || "dev"

// Define a URL base para as requisições do Axios
const baseURL = 
  ENV === "dev" ? "http://localhost:10000/api" :
  ENV === "prod" ? "https://cmex-poc.onrender.com/api" :
  ENV === "staging" ? "https://cmex-poc-amrt.onrender.com/api" :
  ENV === "homolog" ? "https://cmex-back-homolog.onrender.com/api" : ""

// Cria uma instância do Axios
const axiosInstance = axios.create({
  baseURL,
  timeout: 120000,
  withCredentials: true // Importante para CORS com credenciais
})

// Intercepta as requisições
axiosInstance.interceptors.request.use((config) => {
  // Chave do localStorage com o ID correto do projeto
  const SUPABASE_TOKEN = localStorage.getItem('sb-qrfxqaovpddcziulqflw-auth-token')

  // Adiciona o token no header dos chamados
  if (SUPABASE_TOKEN) {
    try {
      const parsedToken = JSON.parse(SUPABASE_TOKEN);
      if (parsedToken && parsedToken.access_token) {
        config.headers.Authorization = `Bearer ${parsedToken.access_token}`
        console.log('Token adicionado:', parsedToken.access_token.substring(0, 10) + '...')
      } else {
        console.warn('Token inválido no localStorage')
      }
    } catch (error) {
      console.error('Erro ao processar token:', error)
    }
  } else {
    console.warn('Token não encontrado no localStorage')
  }
  
  // Define o tipo de dados passado nas requisições
  config.headers["Content-Type"] = "application/json"
  
  return config
})

// Intercepta as respostas para debug
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na requisição:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    })
    return Promise.reject(error)
  }
)

export default axiosInstance