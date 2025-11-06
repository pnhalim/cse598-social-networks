import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import collageUrl from "./assets/collage.jpg";
import api from "./api";
import { validateTextInput } from "./censorshipUtils";

export default function CompleteProfile() {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    major: "",
    academic_year: "",
    profile_picture: "",
    classes_taking: [],
    classes_taken: [],
    learn_best_when: "",
    study_snack: "",
    favorite_study_spot: "",
    mbti: "",
    yap_to_study_ratio: ""
  });

  // Dynamic class input state
  const [currentClass, setCurrentClass] = useState("");
  const [currentPastClass, setCurrentPastClass] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Check for inappropriate content
    const error = validateTextInput(value, name === 'name' ? 'Name' : 
                                    name === 'major' ? 'Major' :
                                    name === 'learn_best_when' ? 'Learn best when' :
                                    name === 'study_snack' ? 'Study snack' :
                                    name === 'favorite_study_spot' ? 'Favorite study spot' :
                                    name === 'mbti' ? 'MBTI' : 'This field');
    
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to capitalize class names
  const capitalizeClassName = (className) => {
    return className.trim()
      .split(' ')
      .map(word => word.toUpperCase())
      .join(' ');
  };

  const addClass = (type) => {
    const classValue = type === 'taking' ? currentClass : currentPastClass;
    if (!classValue.trim()) return;
    
    // Check for inappropriate content in class name
    const error = validateTextInput(classValue, 'Class name');
    if (error) {
      setSubmitMessage(error);
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }
    
    const capitalizedClass = capitalizeClassName(classValue);
    
    setFormData(prev => ({
      ...prev,
      [type === 'taking' ? 'classes_taking' : 'classes_taken']: [
        ...prev[type === 'taking' ? 'classes_taking' : 'classes_taken'],
        capitalizedClass
      ]
    }));
    
    if (type === 'taking') {
      setCurrentClass("");
    } else {
      setCurrentPastClass("");
    }
  };

  const removeClass = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type === 'taking' ? 'classes_taking' : 'classes_taken']: 
        prev[type === 'taking' ? 'classes_taking' : 'classes_taken'].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Check for field errors
    if (Object.keys(fieldErrors).length > 0) {
      setSubmitMessage("Please fix the errors in the form before submitting.");
      return;
    }
    
    // Basic validation
    if (!formData.name || !formData.gender || !formData.major || !formData.academic_year) {
      setSubmitMessage("Please fill in all required fields (Name, Gender, Major, Academic Year).");
      return;
    }
    
    setIsLoading(true);
    setSubmitMessage("");
    
    try {
      const response = await api.post(`/api/complete-profile/${user_id}`, formData);
      
      if (response.data.message) {
        setSubmitMessage("Profile completed successfully! Welcome to Study Buddy.");
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error("Profile completion error:", error);
      const errorMessage = error.response?.data?.detail || "Error completing profile. Please try again.";
      setSubmitMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          width:min(500px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12);
          border-radius:18px;
          padding:24px;
          backdrop-filter: blur(10px);
          text-align: left;
        }

        .form{ display:grid; gap:16px; margin-top:4px; }
        .form-row{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        .label{ text-align:left; font-weight:700; color:#ced9e4; font-size:14px; }
        .label.required::after{ content: " *"; color: #ff6b6b; }
        .input{
          width:100%;
          padding:12px 12px;
          border-radius:12px;
          background:#0c1016;
          border:1px solid #2a3442;
          color:#eef5ff;
          font-size:16px;
        }
        .input:focus{
          outline:none;
          border-color:var(--maize);
          box-shadow:0 0 0 3px var(--ring);
        }
        .select{
          width:100%;
          padding:12px 12px;
          border-radius:12px;
          background:#0c1016;
          border:1px solid #2a3442;
          color:#eef5ff;
          font-size:16px;
        }
        .select:focus{
          outline:none;
          border-color:var(--maize);
          box-shadow:0 0 0 3px var(--ring);
        }
        .textarea{
          width:100%;
          padding:12px 12px;
          border-radius:12px;
          background:#0c1016;
          border:1px solid #2a3442;
          color:#eef5ff;
          font-size:16px;
          min-height:80px;
          resize:vertical;
        }
        .textarea:focus{
          outline:none;
          border-color:var(--maize);
          box-shadow:0 0 0 3px var(--ring);
        }
        .btn{
          width:100%;
          padding:12px 14px;
          border-radius:12px;
          border:0;
          background:var(--maize);
          color:#111;
          font-weight:900;
          font-size:16px;
          cursor:pointer;
        }
        .btn:disabled{
          opacity:0.7;
          cursor:not-allowed;
        }
        .btn-secondary{
          background:transparent;
          border:1px solid rgba(255,255,255,.3);
          color:var(--fg);
        }
        .btn-small{
          padding:6px 12px;
          font-size:14px;
          width:auto;
        }
        .class-input{
          display:flex;
          gap:8px;
          margin-top:8px;
        }
        .class-list{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:8px;
        }
        .class-tag{
          background:rgba(255,205,0,.2);
          color:var(--maize);
          padding:4px 8px;
          border-radius:6px;
          font-size:12px;
          display:flex;
          align-items:center;
          gap:4px;
        }
        .class-tag button{
          background:none;
          border:none;
          color:var(--maize);
          cursor:pointer;
          font-size:14px;
          padding:0;
          margin-left:4px;
        }
        .section-title{
          font-size:18px;
          font-weight:800;
          color:var(--maize);
          margin:24px 0 12px 0;
          border-bottom:1px solid rgba(255,255,255,.1);
          padding-bottom:8px;
        }
        .section-title:first-child{
          margin-top:0;
        }
      `}</style>

      <div className="brand">Study Buddy</div>

      <div className="center">
        <h1 className="headline">Complete Your Profile</h1>
        <div className="sub">Tell us about yourself to find the perfect study buddy</div>

        <section className="card" aria-label="Profile Setup">
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="section-title">Basic Information</div>
            
            <div>
              <label className="label required" htmlFor="name">Full Name</label>
              <input
                id="name"
                className="input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {fieldErrors.name && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            <div className="form-row">
              <div>
                <label className="label required" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  className="select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              
              <div>
                <label className="label required" htmlFor="academic_year">Academic Year</label>
                <select
                  id="academic_year"
                  className="select"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label required" htmlFor="major">Major</label>
              <input
                id="major"
                className="input"
                type="text"
                name="major"
                placeholder="e.g., Computer Science, Engineering, Business"
                value={formData.major}
                onChange={handleInputChange}
                required
              />
              {fieldErrors.major && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.major}
                </div>
              )}
            </div>

            <div className="section-title">Academic Information</div>
            <div>
              <label className="label" htmlFor="classes_taking">Current Classes</label>
              <div className="class-input">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g., eecs 281, math 214"
                  value={currentClass}
                  onChange={(e) => setCurrentClass(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClass('taking'))}
                  style={{ textTransform: 'uppercase' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-small"
                  onClick={() => addClass('taking')}
                >
                  Add
                </button>
              </div>
              {formData.classes_taking.length > 0 && (
                <div className="class-list">
                  {formData.classes_taking.map((cls, index) => (
                    <div key={index} className="class-tag">
                      {cls}
                      <button 
                        type="button" 
                        onClick={() => removeClass('taking', index)}
                        aria-label={`Remove ${cls}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label" htmlFor="classes_taken">Past Classes</label>
              <div className="class-input">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g., eecs 183, math 115"
                  value={currentPastClass}
                  onChange={(e) => setCurrentPastClass(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClass('taken'))}
                  style={{ textTransform: 'uppercase' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-small"
                  onClick={() => addClass('taken')}
                >
                  Add
                </button>
              </div>
              {formData.classes_taken.length > 0 && (
                <div className="class-list">
                  {formData.classes_taken.map((cls, index) => (
                    <div key={index} className="class-tag">
                      {cls}
                      <button 
                        type="button" 
                        onClick={() => removeClass('taken', index)}
                        aria-label={`Remove ${cls}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-title">Study Preferences</div>

            <div>
              <label className="label" htmlFor="learn_best_when">When do you learn best?</label>
              <textarea
                id="learn_best_when"
                className="textarea"
                name="learn_best_when"
                placeholder="e.g., In the morning with coffee, late at night, after exercise..."
                value={formData.learn_best_when}
                onChange={handleInputChange}
              />
              {fieldErrors.learn_best_when && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.learn_best_when}
                </div>
              )}
            </div>

            <div>
              <label className="label" htmlFor="study_snack">Favorite study snack</label>
              <input
                id="study_snack"
                className="input"
                type="text"
                name="study_snack"
                placeholder="e.g., Trail mix, coffee, energy drinks..."
                value={formData.study_snack}
                onChange={handleInputChange}
              />
              {fieldErrors.study_snack && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.study_snack}
                </div>
              )}
            </div>

            <div>
              <label className="label" htmlFor="favorite_study_spot">Favorite study spot</label>
              <input
                id="favorite_study_spot"
                className="input"
                type="text"
                name="favorite_study_spot"
                placeholder="e.g., Hatcher Library, Duderstadt Center, home..."
                value={formData.favorite_study_spot}
                onChange={handleInputChange}
              />
              {fieldErrors.favorite_study_spot && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {fieldErrors.favorite_study_spot}
                </div>
              )}
            </div>

            <div className="form-row">
              <div>
                <label className="label" htmlFor="mbti">MBTI Type (Optional)</label>
                <input
                  id="mbti"
                  className="input"
                  type="text"
                  name="mbti"
                  placeholder="e.g., INTJ, ENFP"
                  value={formData.mbti}
                  onChange={handleInputChange}
                />
                {fieldErrors.mbti && (
                  <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                    {fieldErrors.mbti}
                  </div>
                )}
              </div>
              
              <div>
                <label className="label" htmlFor="yap_to_study_ratio">Chat vs Study Ratio</label>
                <select
                  id="yap_to_study_ratio"
                  className="select"
                  name="yap_to_study_ratio"
                  value={formData.yap_to_study_ratio}
                  onChange={handleInputChange}
                >
                  <option value="">Select ratio</option>
                  <option value="10% yap, 90% study">10% yap, 90% study</option>
                  <option value="20% yap, 80% study">20% yap, 80% study</option>
                  <option value="30% yap, 70% study">30% yap, 70% study</option>
                  <option value="40% yap, 60% study">40% yap, 60% study</option>
                  <option value="50% yap, 50% study">50% yap, 50% study</option>
                </select>
              </div>
            </div>

            <button 
              className="btn" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Completing Profile..." : "Complete Profile"}
            </button>

            {submitMessage && (
              <div style={{ 
                marginTop: "12px", 
                padding: "12px", 
                borderRadius: "8px",
                backgroundColor: submitMessage.includes("successfully") ? "rgba(40, 167, 69, 0.2)" : "rgba(220, 53, 69, 0.2)",
                color: submitMessage.includes("successfully") ? "#28a745" : "#dc3545",
                fontSize: "14px",
                border: `1px solid ${submitMessage.includes("successfully") ? "#28a745" : "#dc3545"}`,
                textAlign: "center"
              }}>
                {submitMessage}
              </div>
            )}
          </form>
        </section>

        <div className="sub">Complete your profile to start finding study buddies and connecting with classmates!</div>
      </div>
    </div>
  );
}
