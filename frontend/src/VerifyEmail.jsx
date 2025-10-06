import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";

export default function VerifyEmail() {
  const { token } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Tell backend to mark email as verified
        await api.get(`/api/verify-email/${token}`);
        // After success, send user to set-password page
        nav(`/set-password/${token}`, { replace: true });
      } catch (err) {
        setError(err?.response?.data?.detail || "Email verification failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, nav]);

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Verifying…</p>;

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto", textAlign: "center" }}>
      <h2>Verification Error</h2>
      <p>{error}</p>
    </div>
  );
}
