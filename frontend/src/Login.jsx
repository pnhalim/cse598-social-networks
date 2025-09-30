import { useState, useEffect, useRef } from "react";
import collageUrl from "./assets/collage.jpg";
export default function StudyBuddy() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayLeaving, setOverlayLeaving] = useState(false)
  const formRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    console.log(isSignUp ? "Sign up:" : "Log in:", { email, password });
  }

  useEffect(() => {
    // focus the first input when toggling modes
    formRef.current?.querySelector("input")?.focus();
  }, [isSignUp]);

  const dismissOverlay = () => {
    if (!showOverlay || overlayLeaving) return;
    setOverlayLeaving(true); // triggers slide-up animation
  };

  return (
    <div className="hero-wrap">
      <style>{`
        :root{
          --maize:#FFCD00;          /* Bumble/maize-like highlight */
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
          color:var(--fg);
          font-family:var(--font);
          position:relative;
          overflow:hidden;
          padding:16px;
        }

        /* Top bar */
        .brand {
          position:fixed;
          top:16px; left:20px;
          font-weight:900;
          letter-spacing:.3px;
          font-size: clamp(22px, 2.2vw, 28px);
          color:#eceff4;
          text-shadow: 0 2px 10px rgba(0,0,0,.35);
        }

        /* Center stack */
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
          line-height:1.02;
          letter-spacing:.8px;
          text-transform:uppercase;
          color:var(--maize);
          text-shadow: 0 10px 30px rgba(0,0,0,.45);
          margin:0;
        }

        .sub{
          margin: 2px 0 6px;
          color:var(--muted);
          font-weight:700;
          letter-spacing:.2px;
          font-size:clamp(14px, 1.5vw, 18px);
        }

        /* Auth card */
        .card{
          margin: 4px auto 0;
          width:min(420px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12);
          border-radius:18px;
          padding:18px;
          box-shadow: 0 24px 60px -24px rgba(0,0,0,.6);
          backdrop-filter: blur(10px);
        }

        .tabs{
          display:flex;
          gap:8px;
          justify-content:center;
          margin-bottom:10px;
        }
        .tab{
          border:1px solid rgba(255,255,255,.18);
          background:#161a21;
          color:#dbe6f2;
          padding:8px 12px;
          border-radius:10px;
          font-weight:800;
          cursor:pointer;
        }
        .tab[aria-selected="true"]{
          background:var(--maize);
          color:#111;
          border-color:transparent;
          box-shadow:0 10px 22px -10px var(--ring);
        }

        .form{
          display:grid; gap:12px; margin-top:4px;
        }
        .label{
          text-align:left; font-weight:700; color:#ced9e4; font-size:14px;
        }
        .input{
          width:100%;
          padding:12px 12px;
          border-radius:12px;
          background:#0c1016;
          border:1px solid #2a3442;
          color:#eef5ff;
          outline:2px solid transparent; outline-offset:2px;
          font-size:16px;
        }
        .input:focus{ border-color:#405b7a; outline-color:var(--ring); }

        .btn{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
          cursor:pointer;
          box-shadow:0 14px 30px -14px var(--ring);
        }
        .btn:hover{ filter:brightness(.98); }
        .btn:active{ transform:translateY(1px); }

        .switch{
          margin-top:6px; color:#cdd9e3; font-size:14px;
        }
        .link{
          background:none; border:0; color:var(--maize);
          font-weight:800; cursor:pointer; padding:0 4px;
        }

        .overlay{
          position:fixed; inset:0; z-index:10;
          display:grid; place-items:center;
          transform:translateY(0);
          transition:transform 800ms cubic-bezier(.22,.8,.18,1),
                     opacity 400ms ease;
          will-change:transform,opacity;
        }
        .overlay::before{
          content:"";
          position:absolute; inset:0;
          background:linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55));
          pointer-events:none;
        }
        .overlay.is-exiting{ transform:translateY(-100%); opacity:0; }
        .overlay .hint{
          position:relative;
          padding:10px 14px; border-radius:999px;
          background:rgba(0,0,0,.55); color:#fff; font-weight:900;
          letter-spacing:.3px; box-shadow:0 8px 24px rgba(0,0,0,.35);
          user-select:none;
        }
        @media (prefers-reduced-motion: reduce){
          .overlay{ transition:none; }
        }

      `}</style>

      {showOverlay && (
        <div
          className={`overlay ${overlayLeaving ? "is-exiting" : ""}`}
          style={{
            backgroundImage: `url(${collageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          role="button"
          aria-label="Enter — slide collage away"
          tabIndex={0}
          onClick={dismissOverlay}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && dismissOverlay()}
          onTransitionEnd={() => {
            if (overlayLeaving) setShowOverlay(false); // unmount after slide
          }}
        >
          <div className="hint">Click to continue</div>
        </div>
      )}
      
      {/* top-left brand */}
      <div className="brand">Study Buddy</div>

      {/* center: headline + sub + auth card */}
      <div className="center">
        <h1 className="headline">Bit by Bit</h1>
        <h1 className="headline">Side by side</h1>

        <div className="sub">It’s better with a buddy.</div>

        <section className="card" aria-label="Authentication">
          <div className="tabs" role="tablist" aria-label="Auth switch">
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

          <form
            ref={formRef}
            className="form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="uniqname@umich.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="btn" type="submit">
              {isSignUp ? "Create account" : "Log in"}
            </button>

            <div className="switch">
              {isSignUp ? "Already have an account?" : "Don’t have an account?"}
              <button
                type="button"
                className="link"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
