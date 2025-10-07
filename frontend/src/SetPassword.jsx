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

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 420, margin: "3rem auto" }}>
      <h2>Set your password</h2>
      <input
        type="password"
        placeholder="New password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        required
        style={{ width: "100%", padding: 12, margin: "8px 0" }}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        style={{ width: "100%", padding: 12, margin: "8px 0" }}
      />
      <button disabled={loading} style={{ width: "100%", padding: 12 }}>
        {loading ? "Saving…" : "Set password"}
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </form>
  );
}
