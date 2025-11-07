import axios from "axios";

// In production on Vercel, use relative URL for same-origin requests
// In development, use the backend server URL with /api prefix
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envURL) {
    const normalized = envURL.replace(/\s+/g, "");
    const withoutTrailingSlash = normalized.replace(/\/*$/, "");
    if (withoutTrailingSlash.endsWith("/api")) {
      return withoutTrailingSlash;
    }
    return `${withoutTrailingSlash}/api`;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:8000/api";
  }

  throw new Error(
    "VITE_API_BASE_URL must be set (e.g. https://your-backend.vercel.app)"
  );
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;