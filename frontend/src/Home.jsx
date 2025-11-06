// src/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me } from "./authService";
import UserList from "./UserList";
import ProfileButton from "./ProfileButton";

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
        
        // Check if profile is completed, redirect if not
        if (!res.data.profile_completed) {
          nav(`/complete-profile/${res.data.id}`, { replace: true });
          return;
        }
      } catch (e) {
        // token missing/invalid
        localStorage.removeItem("jwt");
        nav("/", { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [nav]);

  if (msg) return <p style={{ maxWidth: 480, margin: "2rem auto" }}>{msg}</p>;

  // All users use design1 (list view)
  // Default to UserList if design is not set or is design1
  if (!user?.frontend_design || user?.frontend_design === "design1") {
    return <UserList />;
  }

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", color: "#eaeff5", position: "relative" }}>
      <ProfileButton />
      
      <h1>Welcome{user?.name ? `, ${user.name}` : ""} 👋</h1>
      <p>Your email: {user?.school_email || user?.email}</p>
      <p>Status: {user?.email_verified ? "Verified" : "Unverified"}</p>
      <p>Profile: {user?.profile_completed ? "Completed" : "Incomplete"}</p>
      <p>Design: {user?.frontend_design || "Not assigned"}</p>
      <button
        onClick={() => { localStorage.removeItem("jwt"); nav("/", { replace: true }); }}
        style={{ marginTop: 12 }}
      >
        Log out
      </button>
    </div>
  );
}
