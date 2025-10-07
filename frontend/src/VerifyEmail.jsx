// src/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

export default function VerifyEmail() {
  const { token } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState("Verifying your email…");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/verify-email/${token}`);
        if (!isMounted) return;
        setStatus("Email verified! Redirecting to set password…");
        setTimeout(() => nav(`/set-password/${token}`), 800);
      } catch (e) {
        setStatus(
          e.response?.data?.message ||
            "Verification failed. Your link may be invalid or expired."
        );
      }
    })();
    return () => { isMounted = false; };
  }, [token, nav]);

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h2>Verify Email</h2>
      <p>{status}</p>
    </div>
  );
}
