// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("jwt");
  if (!token) return <Navigate to="/" replace />;
  return children;
}
