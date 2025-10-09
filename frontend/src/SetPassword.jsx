// src/SetPassword.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { setPassword } from "./authService";

export default function SetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (pwd.length < 8) {
      setMsg("Password must be at least 8 characters long.");
      return;
    }
    
    if (pwd !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setMsg("");
    try {
      console.log("sending", { password: pwd, confirm_password: confirm }, "to", `/api/setup-password/${token}`);
      await setPassword(token, pwd, confirm); // confirm_password is set inside service
      setMsg("Password set! Redirecting to login…");
      setTimeout(() => nav("/"), 800);
    } catch (e) {
      const detail =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        "Failed to set password.";
      setMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation feedback
  const isPasswordValid = pwd.length >= 8;
  const doPasswordsMatch = pwd === confirm && confirm.length > 0;
  const isFormValid = isPasswordValid && doPasswordsMatch;

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h2>Set your password</h2>
      
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="New password (minimum 8 characters)"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          style={{ 
            width: "100%", 
            padding: 12, 
            margin: "8px 0",
            border: isPasswordValid || pwd.length === 0 ? "1px solid #ccc" : "1px solid #dc3545"
          }}
        />
        {pwd.length > 0 && (
          <div style={{ fontSize: "12px", color: isPasswordValid ? "#28a745" : "#dc3545", marginTop: "4px" }}>
            {isPasswordValid ? "✓ Password length is valid" : `✗ Password must be at least 8 characters (${pwd.length}/8)`}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ 
            width: "100%", 
            padding: 12, 
            margin: "8px 0",
            border: doPasswordsMatch || confirm.length === 0 ? "1px solid #ccc" : "1px solid #dc3545"
          }}
        />
        {confirm.length > 0 && (
          <div style={{ fontSize: "12px", color: doPasswordsMatch ? "#28a745" : "#dc3545", marginTop: "4px" }}>
            {doPasswordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
          </div>
        )}
      </div>
      
      <button 
        disabled={loading || !isFormValid} 
        style={{ 
          width: "100%", 
          padding: 12,
          backgroundColor: isFormValid ? "#007bff" : "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isFormValid ? "pointer" : "not-allowed"
        }}
      >
        {loading ? "Saving…" : "Set password"}
      </button>
      
      {msg && (
        <p style={{ 
          marginTop: 12, 
          color: msg.includes("✓") || msg.includes("Password set") ? "#28a745" : "#dc3545",
          fontSize: "14px"
        }}>
          {msg}
        </p>
      )}
    </form>
  );
}
