import axios from "axios";

// In production on Vercel, use relative URL for same-origin requests
// In development, use the backend server URL
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL;
  if (envURL) {
    return envURL;
  }
  // If no env var, check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    return "/api"; // Same origin, will be handled by Vercel routing
  }
  // Development fallback
  return "http://localhost:8000";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;