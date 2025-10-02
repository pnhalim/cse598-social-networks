import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { setPassword } from "./authService";

export default function SetPassword() {
  const { token } = useParams();
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPassword(token, pwd);
      nav("/"); // back to login
    } catch (e) {
      alert("Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "2rem auto" }}>
      <h2>Set your password</h2>
      <input
        type="password"
        placeholder="New password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        required
      />
      <button disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}
