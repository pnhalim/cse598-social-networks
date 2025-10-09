// src/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "./authService";

export default function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("Loading…");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await me(); // GET /api/me with bearer from interceptor
        if (!mounted) return;
        setUser(res.data);
        setMsg("");
      } catch (e) {
        // token missing/invalid
        localStorage.removeItem("jwt");
        nav("/", { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [nav]);

  if (msg) return <p style={{ maxWidth: 480, margin: "2rem auto" }}>{msg}</p>;

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", color: "#eaeff5" }}>
      <h1>Welcome{user?.name ? `, ${user.name}` : ""} 👋</h1>
      <p>Your email: {user?.school_email || user?.email}</p>
      <p>Status: {user?.is_verified ? "Verified" : "Unverified"}</p>
      <button
        onClick={() => { localStorage.removeItem("jwt"); nav("/", { replace: true }); }}
        style={{ marginTop: 12 }}
      >
        Log out
      </button>
    </div>
  );
}
