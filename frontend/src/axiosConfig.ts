import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://pocrender-569a.onrender.com", // Base URL para todas as requisições
});

axiosInstance.interceptors.request.use((config) => {
  const supabaseToken = localStorage.getItem('sb-qrfxqaovpddcziulqflw-auth-token');
  if (supabaseToken) {
    config.headers.Authorization = `Bearer ${JSON.parse(supabaseToken).access_token}`;
  }
  config.headers["Content-Type"] = "application/json"
  return config;
});

export default axiosInstance;
