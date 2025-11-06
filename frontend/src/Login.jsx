import { useState, useEffect, useRef } from "react";
import collageUrl from "./assets/collage.jpg";
import { login, requestVerification, resendVerification } from "./authService";

export default function StudyBuddy() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayLeaving, setOverlayLeaving] = useState(false);

  // swipe state
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(null);
  const startTRef = useRef(0);
  const draggingRef = useRef(false);

  const formRef = useRef(null);

  function handleResendVerification() {
    if (!email) {
      setResendMessage("Please enter your email address first.");
      return;
    }
    
    resendVerification(email)
      .then(() => {
        setResendMessage("New verification email sent! Please check your inbox.");
        setShowResend(false);
      })
      .catch((err) => {
        const message = err.response?.data?.detail || "Failed to resend verification email.";
        setResendMessage(message);
      });
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setIsLoading(true);
    setSubmitMessage("");
    
    if (isSignUp) {
      // sign-up: request verification email
      requestVerification(email)
        .then(() => {
          setSubmitMessage("Account created! Check your email for a verification link.");
          // Clear the form
          setEmail("");
        })
        .catch((err) => {
          console.error("Signup error:", {
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
            baseURL: err.config?.baseURL,
          });
          const errorMessage = err.response?.data?.detail || "Error creating account. Please try again.";
          setSubmitMessage(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // login
      login(email, password)
        .then((res) => {
          const token = res.data.access_token || res.data.token;
          localStorage.setItem("jwt", token);
          setSubmitMessage("Login successful! Redirecting...");
          setTimeout(() => window.location.replace("/home"), 500);
        })
        .catch((err) => {
          console.error(err);
          const errorMessage = err.response?.data?.detail || "Login failed. Please check your credentials.";
          setSubmitMessage(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }

  useEffect(() => {
    formRef.current?.querySelector("input")?.focus();
    // Clear messages when switching tabs
    setSubmitMessage("");
    setResendMessage("");
  }, [isSignUp]);

  const dismissOverlay = () => {
    if (!showOverlay || overlayLeaving) return;
    setOverlayLeaving(true);
  };

  function onOverlayPointerDown(e) {
    if (!showOverlay || overlayLeaving) return;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    draggingRef.current = true;
    startYRef.current = y;
    startTRef.current = performance.now();
    setDragOffset(0);
    e.target.setPointerCapture?.(e.pointerId);
  }

  function onOverlayPointerMove(e) {
    if (!draggingRef.current) return;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dy = y - startYRef.current;
    setDragOffset(Math.min(0, dy));
  }

  function onOverlayPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const elapsed = Math.max(1, performance.now() - startTRef.current);
    const velocity = (-dragOffset) / elapsed;
    const passedDistance = dragOffset <= -80;
    const passedVelocity = velocity >= 0.35;

    if (passedDistance || passedVelocity) {
      dismissOverlay();
    } else {
      setDragOffset(0);
    }
  }

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
          background-color: rgba(14, 18, 23, 0.85); /* dark wash */
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
          font-size: clamp(28px, 6vw, 60px);
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

        .tabs{ display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
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
        .btn{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
        }

        .overlay{
          position:fixed; inset:0; z-index:10;
          display:grid; place-items:center;
          transform:translateY(0);
          transition:transform 800ms cubic-bezier(.22,.8,.18,1), opacity 400ms ease;
          will-change:transform,opacity;
          touch-action: pan-y;
          container-type:size;
        }
        .overlay::before{
          content:"";
          position:absolute; inset:0;
          background:linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55));
        }
        .overlay.is-exiting{ transform:translateY(-100%); opacity:0; }
        .overlay.is-dragging{ transition:none; }

        .overlay-title{
          position:absolute;

          display:grid;
          place-items:center;
          text-align:center;

          pointer-events:none;
          z-index:1;
        }
        .overlay-title .study,
        .overlay-title .buddy{
          margin:0;
          font-weight:900;
          text-transform:uppercase;
          -webkit-text-stroke: 2px rgba(0,0,0,.35);
          text-shadow:0 8px 24px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.35);
        }
          /* Inline-link buttons under the form (Log in / Sign up) */
        .switch{
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;                 /* even spacing between the text and button */
          color: var(--muted);
          font-weight: 700;
        }

        .switch .link{
          appearance: none;
          -webkit-appearance: none;
          background: none;
          border: none;
          padding: 0 6px;           /* small horizontal padding so it aligns nicely */
          color: var(--maize);
          text-decoration: underline;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: color .2s ease;
        }

        .switch .link:hover{
          color: #fff;
        }

        .switch .link:focus-visible{
          outline: 2px solid var(--maize);
          outline-offset: 2px;
        }

        @supports (font-size: 1cqi){
          .overlay-title .study,
          .overlay-title .buddy{
            font-size: clamp(80px, min(28cqi, 28cqb), 400px);
          }
        }
        @supports not (font-size: 1cqi){
          .overlay-title .study,
          .overlay-title .buddy{
            font-size: clamp(80px, min(18vw, 20vh), 400px);
          }
        }
        .overlay-title .study{ color:#00274C; }
        .overlay-title .buddy{ color:#FFCB05; }

        .swipe-hint{
          position:absolute;
          bottom: clamp(20px, 6vh, 64px);
          left:50%;
          transform:translateX(-50%);
          display:flex;
          flex-direction:column;
          align-items:center;
          pointer-events:none;
          z-index:1;
        }
        .swipe-hint .label{
          font-weight:900;
          color:#fff;
          background:rgba(0,0,0,.45);
          border-radius:999px;
          font-size:20px;
        }
        .arrow-big{
          width:28px; height:28px;
          border-left:4px solid #fff;
          border-top:4px solid #fff;
          transform:rotate(45deg);
          animation:floatUpBig 1.4s infinite ease-in-out;
        }
        @keyframes floatUpBig{
          0%   { transform: translateY(10px) rotate(45deg); opacity:0; }
          30%  { opacity:1; }
          100% { transform: translateY(-8px) rotate(45deg); opacity:0; }
        }
      `}</style>

      {showOverlay && (
        <div
          className={`overlay ${overlayLeaving ? "is-exiting" : ""} ${dragOffset !== 0 ? "is-dragging" : ""}`}
          style={{
            backgroundImage: `url(${collageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            transform: overlayLeaving ? undefined : `translateY(${dragOffset}px)`
          }}
          role="button"
          aria-label="Swipe up to continue"
          tabIndex={0}
          onClick={dismissOverlay}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && dismissOverlay()}
          onPointerDown={onOverlayPointerDown}
          onPointerMove={onOverlayPointerMove}
          onPointerUp={onOverlayPointerUp}
          onPointerCancel={onOverlayPointerUp}
          onTouchStart={onOverlayPointerDown}
          onTouchMove={onOverlayPointerMove}
          onTouchEnd={onOverlayPointerUp}
          onTransitionEnd={() => {
            if (overlayLeaving) setShowOverlay(false);
            if (!overlayLeaving && dragOffset !== 0) setDragOffset(0);
          }}
        >
          <div className="overlay-title" aria-hidden="true">
            <div className="study">STUDY</div>
            <div className="buddy">BUDDY</div>
          </div>

          <div className="swipe-hint" aria-hidden="true">
            <div className="arrow-big" />
            <div className="label">Swipe up</div>
          </div>
        </div>
      )}

      <div className="brand">Study Buddy</div>

      <div className="center">
        <h1 className="headline">Better Studying</h1>
        <h1 className="headline">Starts With a Buddy</h1>

        <section className="card" aria-label="Authentication">
          <div className="tabs" role="tablist" aria-label="Auth switch">
            <button className="tab" role="tab" aria-selected={!isSignUp} onClick={() => setIsSignUp(false)}>
              Log in
            </button>
            <button className="tab" role="tab" aria-selected={isSignUp} onClick={() => setIsSignUp(true)}>
              Sign up
            </button>
          </div>

          <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="uniqname@umich.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {!isSignUp && (
              <>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            )}

            <button 
              className="btn" 
              type="submit" 
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? (
                isSignUp ? "Creating account..." : "Logging in..."
              ) : (
                isSignUp ? "Create account" : "Log in"
              )}
            </button>

            <div className="switch">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button type="button" className="link" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </div>
          </form>

          {submitMessage && (
            <div style={{ 
              marginTop: "12px", 
              padding: "12px", 
              borderRadius: "8px",
              backgroundColor: submitMessage.includes("successful") || submitMessage.includes("created") ? "rgba(40, 167, 69, 0.2)" : "rgba(220, 53, 69, 0.2)",
              color: submitMessage.includes("successful") || submitMessage.includes("created") ? "#28a745" : "#dc3545",
              fontSize: "14px",
              border: `1px solid ${submitMessage.includes("successful") || submitMessage.includes("created") ? "#28a745" : "#dc3545"}`,
              textAlign: "center"
            }}>
              {submitMessage}
            </div>
          )}

          {isSignUp && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              {!showResend ? (
                <button
                  type="button"
                  className="link"
                  onClick={() => setShowResend(true)}
                  style={{
                    color: "#FFCB05",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    textDecoration: "underline"
                  }}
                >
                  Didn't receive verification email?
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleResendVerification}
                    style={{
                      background: "#FFCB05",
                      color: "#111",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  >
                    Resend Verification Email
                  </button>
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      setShowResend(false);
                      setResendMessage("");
                    }}
                    style={{
                      color: "#C8D3DE",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {resendMessage && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    borderRadius: "6px",
                    backgroundColor: resendMessage.includes("sent")
                      ? "rgba(40, 167, 69, 0.2)"
                      : "rgba(220, 53, 69, 0.2)",
                    color: resendMessage.includes("sent") ? "#28a745" : "#dc3545",
                    fontSize: "12px",
                    border: `1px solid ${
                      resendMessage.includes("sent") ? "#28a745" : "#dc3545"
                    }`
                  }}
                >
                  {resendMessage}
                </div>
              )}
            </div>
          )}

        </section>

        <div className="sub">Use Study Buddy to find study partners and project partners in a low-commitment context. Meet once, and if you hit it off, then you've found a study buddy!</div>

      </div>
    </div>
  );
}
