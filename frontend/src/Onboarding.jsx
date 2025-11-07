import { useState } from "react";
import { useNavigate } from "react-router-dom";
import collageUrl from "./assets/collage.jpg";
import api from "./api";

export default function Onboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  
  // Preference state
  const [preferences, setPreferences] = useState({
    match_by_gender: false,
    match_by_major: false,
    match_by_academic_year: false,
    match_by_study_preferences: false,
    match_by_classes: false,
  });

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setSubmitMessage("");
    
    try {
      const response = await api.post("/onboarding/complete", preferences);
      
      if (response.data) {
        setSubmitMessage("Preferences saved successfully!");
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      const errorMessage = error.response?.data?.detail || "Error saving preferences. Please try again.";
      setSubmitMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-wrap">
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

        .onboarding-wrap{
          min-height:100vh;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
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
          padding:20px;
        }

        .brand {
          position:fixed;
          top:16px; left:20px;
          font-weight:900;
          font-size: clamp(22px, 2.2vw, 28px);
          color:#eceff4;
          text-shadow: 0 2px 10px rgba(0,0,0,.35);
        }

        .onboarding-container{
          width:min(600px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12);
          border-radius:18px;
          padding:32px;
          backdrop-filter: blur(10px);
        }

        .headline{
          font-size:clamp(28px, 5vw, 48px);
          font-weight:900;
          color:var(--maize);
          margin:0 0 12px 0;
          text-align:center;
        }

        .sub{
          margin: 0 0 24px;
          color:var(--muted);
          font-weight:600;
          font-size:clamp(14px, 1.5vw, 16px);
          text-align:center;
          line-height:1.6;
        }

        .disclaimer-box{
          background: linear-gradient(135deg, rgba(255,205,0,.15), rgba(255,107,53,.1));
          border:2px solid rgba(255,205,0,.4);
          border-radius:12px;
          padding:20px;
          margin-bottom:32px;
          text-align:center;
        }

        .disclaimer-title{
          font-size:18px;
          font-weight:800;
          color:var(--maize);
          margin:0 0 12px 0;
        }

        .disclaimer-text{
          font-size:14px;
          color:var(--fg);
          line-height:1.6;
          margin:0;
        }

        .preferences-section{
          margin-bottom:24px;
        }

        .section-title{
          font-size:18px;
          font-weight:800;
          color:var(--maize);
          margin:0 0 16px 0;
          border-bottom:2px solid rgba(255,205,0,.3);
          padding-bottom:8px;
        }

        .preference-item{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:16px;
          margin-bottom:12px;
          background:rgba(255,255,255,.02);
          border:1px solid rgba(255,255,255,.08);
          border-radius:10px;
          transition:all 0.2s ease;
        }

        .preference-item:hover{
          background:rgba(255,255,255,.04);
          border-color:rgba(255,205,0,.3);
        }

        .preference-label{
          flex:1;
          font-size:15px;
          font-weight:600;
          color:var(--fg);
        }

        .preference-description{
          font-size:12px;
          color:var(--muted);
          margin-top:4px;
        }

        .toggle-switch{
          position:relative;
          width:52px;
          height:28px;
          background:rgba(255,255,255,.1);
          border-radius:14px;
          cursor:pointer;
          transition:background 0.3s ease;
          border:2px solid rgba(255,255,255,.2);
        }

        .toggle-switch.active{
          background:var(--maize);
          border-color:var(--maize);
        }

        .toggle-switch::after{
          content:'';
          position:absolute;
          top:2px;
          left:2px;
          width:20px;
          height:20px;
          background:white;
          border-radius:50%;
          transition:transform 0.3s ease;
          box-shadow:0 2px 4px rgba(0,0,0,.2);
        }

        .toggle-switch.active::after{
          transform:translateX(24px);
        }

        .btn{
          width:100%;
          padding:14px 20px;
          border-radius:12px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
          font-size:16px;
          cursor:pointer;
          transition:all 0.2s ease;
          margin-top:8px;
        }

        .btn:hover:not(:disabled){
          background:#e6b800;
          transform:translateY(-1px);
          box-shadow:0 4px 12px rgba(255,205,0,.3);
        }

        .btn:disabled{
          opacity:0.7;
          cursor:not-allowed;
        }

        .message{
          margin-top:16px;
          padding:12px;
          border-radius:8px;
          text-align:center;
          font-size:14px;
          font-weight:600;
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

      <div className="onboarding-container">
        <h1 className="headline">Welcome to Study Buddy!</h1>
        <p className="sub">Let's set up your matching preferences</p>

        <div className="disclaimer-box">
          <div className="disclaimer-title">🌟 Inclusive Matching & Community Ethos</div>
          <p className="disclaimer-text">
            Study Buddy thrives on diverse learning environments. Keep your preferences broad for the best matches and to connect with a wide range of study partners.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="preferences-section">
            <div className="section-title">Matching Preferences</div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', fontStyle: 'italic' }}>
              Toggle preferences to prioritize similar people. All users are shown, but those matching your preferences appear first.
            </p>
            
            <div className="preference-item">
              <div style={{ flex: 1 }}>
                <div className="preference-label">Prioritize Same Gender</div>
                <div className="preference-description">Recommend people with the same gender higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_gender ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_gender')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_gender')}
                aria-label="Toggle match by gender"
              />
            </div>

            <div className="preference-item">
              <div style={{ flex: 1 }}>
                <div className="preference-label">Prioritize Same Major</div>
                <div className="preference-description">Recommend people with the same major first</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_major ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_major')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_major')}
                aria-label="Toggle match by major"
              />
            </div>

            <div className="preference-item">
              <div style={{ flex: 1 }}>
                <div className="preference-label">Prioritize Same Academic Year</div>
                <div className="preference-description">Recommend people in the same year first</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_academic_year ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_academic_year')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_academic_year')}
                aria-label="Toggle match by academic year"
              />
            </div>

            <div className="preference-item">
              <div style={{ flex: 1 }}>
                <div className="preference-label">Prioritize Similar Study Preferences</div>
                <div className="preference-description">Recommend people with similar study habits first</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_study_preferences ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_study_preferences')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_study_preferences')}
                aria-label="Toggle match by study preferences"
              />
            </div>

            <div className="preference-item">
              <div style={{ flex: 1 }}>
                <div className="preference-label">Prioritize Similar Classes</div>
                <div className="preference-description">Recommend people taking similar classes first</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_classes ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_classes')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_classes')}
                aria-label="Toggle match by classes"
              />
            </div>
          </div>

          <button 
            className="btn" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue to Study Buddy"}
          </button>

          {submitMessage && (
            <div className={`message ${submitMessage.includes("successfully") ? "success" : "error"}`}>
              {submitMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

