// src/SetPassword.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { setPassword } from "./authService";
import collageUrl from "./assets/collage.jpg";

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
      const response = await setPassword(token, pwd, confirm); // confirm_password is set inside service
      
      // Store the JWT token for automatic login
      if (response.data.access_token) {
        localStorage.setItem("jwt", response.data.access_token);
        setMsg("Password set! You are now logged in. Redirecting to complete your profile…");
        setTimeout(() => nav(`/complete-profile/${response.data.user_id}`), 800);
      } else {
        setMsg("Password set! Redirecting to login…");
        setTimeout(() => nav("/"), 800);
      }
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
    <div className="hero-wrap">
      <style>{`
        :root{
          --maize:#FFCD00;
          --ink:#0a0b0d;
          --ink-2:#1a1d21;
          --fg:#EAEFF5;
          --muted:#C8D3DE;
          --ring:rgba(255,205,0,.35);
          --font: "BumbleSansCondensed","BumbleSansCondensedFallback",
                  -apple-system,"San Francisco","Helvetica Neue",
                  Roboto,"Segoe WP","Segoe UI",sans-serif;
        }
        * { box-sizing: border-box; }
        body { margin:0; }

        .hero-wrap{
          min-height:100vh;
          display:grid;
          grid-template-rows:auto 1fr;
          background:
            radial-gradient(80% 120% at 50% -10%, #2a3139 0%, transparent 55%),
            radial-gradient(80% 120% at 50% 110%, #191c22 0%, transparent 55%),
            linear-gradient(180deg, #0e1217 0%, #0b0e13 100%);
          background-image: url(${collageUrl});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-blend-mode: overlay;
          background-color: rgba(14, 18, 23, 0.85);
          color:var(--fg);
          font-family:var(--font);
          position:relative;
          overflow:hidden;
          padding:16px;
        }

        .brand {
          position:fixed;
          top:16px; left:20px;
          font-weight:900;
          font-size: clamp(22px, 2.2vw, 28px);
          color:#eceff4;
          text-shadow: 0 2px 10px rgba(0,0,0,.35);
        }

        .center{
          place-self:center;
          text-align:center;
          width:min(920px, 92vw);
          display:grid;
          gap:20px;
        }

        .headline{
          font-size:clamp(32px, 7vw, 72px);
          font-weight:900;
          color:var(--maize);
          margin:0;
        }

        .sub{
          margin: 2px 0 6px;
          color:var(--muted);
          font-weight:700;
          font-size:clamp(14px, 1.5vw, 18px);
        }

        .card{
          margin: 4px auto 0;
          width:min(420px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12);
          border-radius:18px;
          padding:18px;
          backdrop-filter: blur(10px);
        }

        .form{ display:grid; gap:12px; margin-top:4px; }
        .label{ text-align:left; font-weight:700; color:#ced9e4; font-size:14px; }
        .input{
          width:100%;
          padding:12px 12px;
          border-radius:12px;
          background:#0c1016;
          border:1px solid #2a3442;
          color:#eef5ff;
          font-size:16px;
        }
        .input.error{
          border-color:#dc3545;
        }
        .btn{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
          cursor:pointer;
        }
        .btn:disabled{
          background:#6c757d;
          cursor:not-allowed;
        }
        .validation-message{
          font-size:12px;
          margin-top:4px;
          text-align:left;
        }
        .validation-message.success{
          color:#28a745;
        }
        .validation-message.error{
          color:#dc3545;
        }
        .message{
          margin-top:12px;
          padding:12px;
          border-radius:8px;
          font-size:14px;
          text-align:center;
        }
        .message.success{
          background:rgba(40, 167, 69, 0.2);
          color:#28a745;
          border:1px solid #28a745;
        }
        .message.error{
          background:rgba(220, 53, 69, 0.2);
          color:#dc3545;
          border:1px solid #dc3545;
        }
      `}</style>

      <div className="brand">Study Buddy</div>

      <div className="center">
        <h1 className="headline">Set Your Password</h1>
        <div className="sub">Create a secure password for your account</div>

        <section className="card" aria-label="Set Password">
          <form className="form" onSubmit={onSubmit} noValidate>
            <label className="label" htmlFor="password">New Password</label>
            <input
              id="password"
              className={`input ${pwd.length > 0 && !isPasswordValid ? 'error' : ''}`}
              type="password"
              placeholder="Minimum 8 characters"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
            />
            {pwd.length > 0 && (
              <div className={`validation-message ${isPasswordValid ? 'success' : 'error'}`}>
                {isPasswordValid ? "✓ Password length is valid" : `✗ Password must be at least 8 characters (${pwd.length}/8)`}
              </div>
            )}
            
            <label className="label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              className={`input ${confirm.length > 0 && !doPasswordsMatch ? 'error' : ''}`}
              type="password"
              placeholder="Confirm your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {confirm.length > 0 && (
              <div className={`validation-message ${doPasswordsMatch ? 'success' : 'error'}`}>
                {doPasswordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}

            <button 
              className="btn" 
              type="submit" 
              disabled={loading || !isFormValid}
              style={{
                opacity: loading || !isFormValid ? 0.7 : 1
              }}
            >
              {loading ? "Setting password..." : "Set password"}
            </button>
          </form>

          {msg && (
            <div className={`message ${msg.includes("✓") || msg.includes("Password set") ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
