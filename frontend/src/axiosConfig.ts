import axios from "axios";

// Verifica se estamos em ambiente local
const isLocal =
  typeof window !== "undefined" && window.location.hostname === "localhost";

// Define a URL base
const baseURL = isLocal
  ? "http://localhost:10000/api"  
  : "https://cmex-poc.onrender.com/api";  

const axiosInstance = axios.create({
  baseURL,
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