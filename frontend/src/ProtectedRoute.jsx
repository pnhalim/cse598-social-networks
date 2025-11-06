// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("jwt");
  if (!token) return <Navigate to="/" replace />;
  return (
    <SidebarProvider>
      <Sidebar />
      {children}
    </SidebarProvider>
  );
}
