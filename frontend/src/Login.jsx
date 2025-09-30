import { useState } from "react";

export default function StudyBuddy() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!email.endsWith("@umich.edu")) {
      setError("Email must be a valid @umich.edu address.");
      return;
    }

    setError("");
    console.log("Logged in with:", email, password);
  }

  return (
    <div className="studybuddy-container">
      <style>{`
        :root {
          /* Primary palette around #2F88A7 */
          --primary: #2F88A7;        /* main */
          --primary-700: #296F89;    /* darker shade */
          --primary-800: #225a6f;    /* even darker */
          --primary-500: #49a1c0;    /* lighter tint */
          --primary-100: #d3edf6;    /* very light text */
          --secondary: #2F4FA7;      /* adjacent hue used sparingly */
          --error: #A7123A;          /* error */
        }

        html, body { margin: 0; height: 100%; font-family: 'Inter', system-ui, sans-serif; background: var(--primary-800); }

        /*
         * Background photo + theme-tinted overlay
         * Uses the UMich image requested and a gradient overlay that matches
         * the original color theme (secondary -> primary).
         */
        .studybuddy-container {
          position: relative;
          /* Move the card to the left with a fixed viewport padding */
          display: flex; align-items: center; justify-content: flex-start;
          height: 100vh; color: white;
          padding-left: 10vw; /* ~10% of viewport width from the left edge */
          background-image: url('https://internationalcenter.umich.edu/sites/default/files/2024-12/I_am_Michigan_1440_620.webp');
          background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .studybuddy-container { padding-left: 6vw; justify-content: center; }
        }
        .studybuddy-container::before {
          content: ""; position: absolute; inset: 0; z-index: 0;
          /* Tint with your original gradient colors */
          background: linear-gradient(135deg, rgba(47,79,167,0.64), rgba(47,136,167,0.64));
        }
        /* Optional soft vignette for readability */
        .studybuddy-container::after {
          content: ""; position: absolute; inset: 0; z-index: 0;
          background: radial-gradient(1000px 400px at 50% -10%, rgba(255,255,255,0.10), transparent 60%),
                      radial-gradient(1400px 500px at 50% 110%, rgba(0,0,0,0.25), transparent 55%);
          pointer-events: none;
        }

        .card {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px; padding: 2.2rem 2.4rem; border-radius: 20px;
          background: rgba(0, 20, 30, 0.35);
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
          backdrop-filter: blur(14px) saturate(1.05);
        }

        .brand { font-size: 2.4rem; font-weight: 900; letter-spacing:.3px; }
        .brand em {
          font-style: normal; color: white; background: linear-gradient(90deg, var(--primary-700), var(--primary));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .subtitle { color: var(--primary-100); margin-top:.2rem; margin-bottom: 1.6rem; }

        h1 { margin: 0 0 1.2rem; font-size: 1.9rem; font-weight: 800; color: #fff; }

        .tabs { display:flex; gap:8px; margin-bottom: .6rem; }
        .tab { flex:1; padding:.6rem .8rem; border-radius: 12px; border:1px solid rgba(255,255,255,.16);
               background: rgba(255,255,255,.08); color:#eaf7fb; font-weight:700; cursor:pointer; }
        .tab[aria-selected="false"] { opacity:.65; }

        form { margin-top:.4rem; }
        .field { display:grid; gap:6px; margin:.65rem 0; }
        label { font-size:.92rem; color:#f6fbfd; }
        .input { width:100%; padding:.9rem .95rem; border-radius:12px; color:#fff; font-size:1rem;
                 background: rgba(5,20,30,.45); border:1px solid rgba(255,255,255,.18); outline:none;
                 transition:border .15s, box-shadow .15s; }
        .input::placeholder{ color: rgba(255,255,255,.75); }
        .input:focus { border-color: var(--primary-500); box-shadow:0 0 0 4px rgba(47,136,167,.25); }

        .btn-primary { width:100%; padding: .95rem 1rem; margin-top:.8rem; border:0; border-radius:12px;
                       font-weight:800; color:white; cursor:pointer;
                       background: linear-gradient(90deg, var(--primary-800), var(--primary));
                       transition: transform .15s, filter .15s; }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .btn-primary:active { transform: translateY(0); }

        .muted { color: var(--primary-100); margin-top:1rem; }
        .toggle { background:none; border:none; font-weight:800; cursor:pointer; padding:0 .2rem; color: var(--primary-500); text-decoration: underline; }
        .toggle:hover { color: #fff; }

        .error { color: var(--error); margin-top:.6rem; font-size:.95rem; font-weight:700; }
      `}</style>

      <div className="card" role="region" aria-label="Authentication">
        <div className="brand">
          <em>StudyBuddy</em>
        </div>
        <div className="subtitle">Find your perfect study match 🎓</div>

        <div className="tabs" role="tablist">
          <button
            className="tab"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => setIsSignUp(false)}
          >
            Log in
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => setIsSignUp(true)}
          >
            Sign up
          </button>
        </div>

        <h1>{isSignUp ? "Create your account" : "Welcome Wolverines"}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@umich.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-primary" type="submit">
            {isSignUp ? "Create account" : "Log in"}
          </button>
        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <p className="muted">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="toggle"
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>

        <p className="muted">Start matching in minutes.</p>
      </div>
    </div>
  );
}
