// src/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

export default function VerifyEmail() {
  const { code } = useParams(); // Changed from 'token' to 'code'
  const nav = useNavigate();
  const [status, setStatus] = useState("Verifying your email…");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Exchange verification code for JWT token
        const res = await api.post(`/verify-code/${code}`);
        if (!isMounted) return;
        
        // Store the JWT token for future API calls
        if (res.data.token) {
          localStorage.setItem("jwt", res.data.token);
        }
        
        setStatus("Email verified! Redirecting to set password…");
        setTimeout(() => nav(`/set-password/${res.data.token}`), 800);
      } catch (e) {
        setStatus(
          e.response?.data?.detail ||
            "Verification failed. Your link may be invalid or expired."
        );
      }
    })();
    return () => { isMounted = false; };
  }, [code, nav]);

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h2>Verify Email</h2>
      <p>{status}</p>
    </div>
  );
}
