import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { me, updateUserProfile } from "./authService";
import api from "./api";
import collageUrl from "./assets/collage.jpg";
import { validateTextInput } from "./censorshipUtils";
import { useSidebar } from "./SidebarContext";

export default function Profile() {
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [newCurrentClass, setNewCurrentClass] = useState("");
  const [newPastClass, setNewPastClass] = useState("");
  const [preferences, setPreferences] = useState({
    match_by_gender: false,
    match_by_major: false,
    match_by_academic_year: false,
    match_by_study_preferences: false,
    match_by_classes: false,
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await me();
        setUser(response.data);
        setEditData({
          name: response.data.name || "",
          gender: response.data.gender || "",
          major: response.data.major || "",
          academic_year: response.data.academic_year || "",
          learn_best_when: response.data.learn_best_when || "",
          study_snack: response.data.study_snack || "",
          favorite_study_spot: response.data.favorite_study_spot || "",
          mbti: response.data.mbti || "",
          yap_to_study_ratio: response.data.yap_to_study_ratio || "",
          classes_taking: Array.isArray(response.data.classes_taking) ? response.data.classes_taking : [],
          classes_taken:  Array.isArray(response.data.classes_taken)  ? response.data.classes_taken  : [],
        });
        setPreferences({
          match_by_gender: response.data.match_by_gender || false,
          match_by_major: response.data.match_by_major || false,
          match_by_academic_year: response.data.match_by_academic_year || false,
          match_by_study_preferences: response.data.match_by_study_preferences || false,
          match_by_classes: response.data.match_by_classes || false,
        });
      } catch (error) {
        console.error("Error loading user:", error);
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

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
    
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Optional: normalize course labels a bit, e.g., "eecs 280" -> "EECS 280"
  const normalizeCourse = (s) =>
    String(s).trim().replace(/\s+/g, " ").toUpperCase();

  const addClassTo = (key, value) => {
    const v = normalizeCourse(value);
    if (!v) return;
    setEditData(prev => {
      const next = new Set(prev[key] || []);
      next.add(v); // dedupe
      return { ...prev, [key]: Array.from(next) };
    });
  };

  const removeClassAt = (key, idx) => {
    setEditData(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(idx, 1);
      return { ...prev, [key]: arr };
    });
  };

  const handleSave = async () => {
    // Check for field errors
    if (Object.keys(fieldErrors).length > 0) {
      setMessage("Please fix the errors in the form before saving.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    try {
      const payload = {
        name: editData.name?.trim() || null,
        gender: editData.gender || null,
        major: editData.major?.trim() || null,
        academic_year: editData.academic_year || null,
        learn_best_when: editData.learn_best_when?.trim() || null,
        study_snack: editData.study_snack?.trim() || null,
        favorite_study_spot: editData.favorite_study_spot?.trim() || null,
        mbti: editData.mbti?.trim()?.toUpperCase() || null,
        yap_to_study_ratio: editData.yap_to_study_ratio || null,
        classes_taking: (editData.classes_taking || []).map(normalizeCourse),
        classes_taken:  (editData.classes_taken  || []).map(normalizeCourse),
      };
      
      // Actually call the backend API to save the changes
      const response = await updateUserProfile(payload);
      
      // Update local state with the response from backend
      setUser(response.data);
      
      setMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(error.response?.data?.detail || "Failed to update profile");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/", { replace: true });
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    setMessage("");
    
    try {
      const response = await api.put("/api/user/preferences", preferences);
      setUser(response.data);
      setMessage("Preferences updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating preferences:", error);
      setMessage(error.response?.data?.detail || "Failed to update preferences");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-wrapper">
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

          .profile-wrapper{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            min-height:100vh;
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
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            font-size: 18px;
            color: var(--muted);
          }
        `}</style>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
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

        .profile-wrapper{
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          min-height:100vh;
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
          overflow-y: auto;
        }

        .profile-container{
          min-height:100vh;
          color:var(--fg);
          font-family:var(--font);
          padding:20px 20px 20px 12px;
          margin-left: ${isOpen ? '260px' : '70px'};
          transition: margin-left 0.3s ease;
        }

        @media (max-width: 768px) {
          .profile-container {
            margin-left: 0;
            padding-top: 70px;
          }
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .title {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 900;
          color: var(--maize);
          margin: 0 0 8px 0;
          font-family: var(--font);
        }

        .subtitle {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
          font-family: var(--font);
        }

        .profile-card {
          max-width: 1000px;
          margin: 0 auto;
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .profile-sidebar {
          position: sticky;
          top: 20px;
        }

        .profile-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .profile-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .profile-sidebar {
            position: static;
          }
        }

        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, rgba(255,205,0,.12), rgba(255,107,53,.08));
          border: 1px solid rgba(255,205,0,.3);
          border-radius: 16px;
          backdrop-filter: blur(15px);
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,205,0,.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, -20px) rotate(180deg); }
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--maize), #ff6b35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 900;
          color: #111;
          flex-shrink: 0;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
          box-shadow: 0 6px 24px rgba(255,205,0,.3);
          border: 3px solid rgba(255,255,255,.2);
        }

        .profile-info h2 {
          font-size: 24px;
          font-weight: 900;
          color: var(--fg);
          margin: 0 0 8px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,.3);
          position: relative;
          z-index: 1;
          font-family: var(--font);
        }

        .profile-info p {
          color: var(--muted);
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          z-index: 1;
          font-family: var(--font);
        }

        .profile-info p:last-child {
          color: var(--maize);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255,205,0,.1);
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          margin-top: 6px;
        }

        .profile-section {
          margin-bottom: 0;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .profile-section:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(255,255,255,.1);
          transform: translateY(-2px);
        }

        .stats-card {
          background: linear-gradient(135deg, rgba(255,205,0,.08), rgba(255,107,53,.05));
          border: 1px solid rgba(255,205,0,.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .stats-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--maize);
          margin: 0 0 12px 0;
          text-align: center;
          font-family: var(--font);
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font);
        }

        .stat-value {
          color: var(--fg);
          font-size: 14px;
          font-weight: 700;
          font-family: var(--font);
        }

        .section-title {
          font-size: 16px;
          font-weight: 900;
          color: var(--maize);
          margin: 0 0 12px 0;
          border-bottom: 2px solid var(--maize);
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          font-family: var(--font);
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, var(--maize), transparent);
        }

        .field {
          margin-bottom: 12px;
          padding: 12px;
          background: rgba(255,255,255,.02);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.05);
          transition: all 0.2s ease;
        }

        .field:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(255,255,255,.1);
        }

        .field-label {
          display: block;
          font-weight: 800;
          color: var(--maize);
          font-size: 11px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: var(--font);
        }

        .field-value {
          color: var(--fg);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
          padding: 2px 0;
          font-family: var(--font);
        }

        .field-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(12, 16, 22, 0.8);
          border: 2px solid rgba(42, 52, 66, 0.6);
          color: #eef5ff;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: var(--font);
        }

        .field-input:focus {
          outline: none;
          border-color: var(--maize);
          box-shadow: 0 0 0 3px var(--ring);
          background: rgba(12, 16, 22, 0.9);
        }

        .field-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(12, 16, 22, 0.8);
          border: 2px solid rgba(42, 52, 66, 0.6);
          color: #eef5ff;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: var(--font);
        }

        .field-select:focus {
          outline: none;
          border-color: var(--maize);
          box-shadow: 0 0 0 3px var(--ring);
          background: rgba(12, 16, 22, 0.9);
        }

        .button-group {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.1);
        }

        .btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: 0;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font);
        }

        .btn-primary {
          background: var(--maize);
          color: #111;
        }

        .btn-primary:hover {
          background: #e6b800;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255,255,255,.3);
          color: var(--fg);
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          background: rgba(40, 167, 69, 0.9);
          color: white;
          font-weight: 600;
          z-index: 1000;
          animation: slideIn 0.3s ease;
          font-family: var(--font);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .classes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .class-tag {
          background: linear-gradient(135deg, rgba(255,205,0,.25), rgba(255,107,53,.15));
          color: var(--maize);
          padding: 6px 10px;
          font-family: var(--font);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid rgba(255,205,0,.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .no-classes {
          color: var(--muted);
          font-style: italic;
          font-size: 12px;
          font-family: var(--font);
        }

        .not-provided {
          color: var(--muted);
          font-style: italic;
          font-size: 13px;
          opacity: 0.7;
          font-family: var(--font);
        }
      `}</style>

      <div className="profile-container">
        <div className="header">
          <h1 className="title">My Profile</h1>
          <p className="subtitle">View and edit your profile information</p>
        </div>

      {message && (
        <div className="message">{message}</div>
      )}

      <div className="profile-card">
        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="profile-info">
                <h2>{user?.name || 'Anonymous'}</h2>
                <p>{user?.school_email}</p>
              </div>
            </div>

            <div className="stats-card">
              <h3 className="stats-title">Profile Stats</h3>
              <div className="stat-item">
                <span className="stat-label">Profile Completion</span>
                <span className="stat-value">{user?.profile_completed ? '100%' : 'Incomplete'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Email Status</span>
                <span className="stat-value">{user?.email_verified ? 'Verified' : 'Pending'}</span>
              </div>
              {user?.trusted_badge_this_week && (
                <div className="stat-item">
                  <span className="stat-label">Badge</span>
                  <span className="stat-value" style={{ color: 'var(--maize)', fontWeight: 700 }}>
                    ⭐ Trusted Study Buddy This Week
                  </span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">Current Classes</span>
                <span className="stat-value">{user?.classes_taking?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Past Classes</span>
                <span className="stat-value">{user?.classes_taken?.length || 0}</span>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => navigate('/connections')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--maize)',
                    color: '#111',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#ffd54f'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--maize)'}
                >
                  View My Connections
                </button>
              </div>
            </div>
          </div>

          <div className="profile-main">

        <div className="profile-section">
          <h3 className="section-title">Basic Information</h3>
          
          <div className="field">
            <label className="field-label">Name</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.name || <span className="not-provided">Not provided</span>}</div>
            )}
            {fieldErrors.name && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.name}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Gender</label>
            {isEditing ? (
              <select
                className="field-select"
                name="gender"
                value={editData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <div className="field-value">{user?.gender || 'Not provided'}</div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Major</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="major"
                value={editData.major}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.major || 'Not provided'}</div>
            )}
            {fieldErrors.major && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.major}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Academic Year</label>
            {isEditing ? (
              <select
                className="field-select"
                name="academic_year"
                value={editData.academic_year}
                onChange={handleInputChange}
              >
                <option value="">Select year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            ) : (
              <div className="field-value">{user?.academic_year || 'Not provided'}</div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Study Preferences</h3>
          
          <div className="field">
            <label className="field-label">I learn best when...</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="learn_best_when"
                value={editData.learn_best_when}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.learn_best_when || 'Not provided'}</div>
            )}
            {fieldErrors.learn_best_when && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.learn_best_when}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Study Snack</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="study_snack"
                value={editData.study_snack}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.study_snack || 'Not provided'}</div>
            )}
            {fieldErrors.study_snack && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.study_snack}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Favorite Study Spot</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="favorite_study_spot"
                value={editData.favorite_study_spot}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.favorite_study_spot || 'Not provided'}</div>
            )}
            {fieldErrors.favorite_study_spot && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.favorite_study_spot}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">MBTI Type</label>
            {isEditing ? (
              <input
                className="field-input"
                type="text"
                name="mbti"
                value={editData.mbti}
                onChange={handleInputChange}
              />
            ) : (
              <div className="field-value">{user?.mbti || 'Not provided'}</div>
            )}
            {fieldErrors.mbti && (
              <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.mbti}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Chat vs Study Ratio</label>
            {isEditing ? (
              <select
                className="field-select"
                name="yap_to_study_ratio"
                value={editData.yap_to_study_ratio}
                onChange={handleInputChange}
              >
                <option value="">Select ratio</option>
                <option value="10% yap, 90% study">10% yap, 90% study</option>
                <option value="20% yap, 80% study">20% yap, 80% study</option>
                <option value="30% yap, 70% study">30% yap, 70% study</option>
                <option value="40% yap, 60% study">40% yap, 60% study</option>
                <option value="50% yap, 50% study">50% yap, 50% study</option>
              </select>
            ) : (
              <div className="field-value">{user?.yap_to_study_ratio || 'Not provided'}</div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Classes</h3>
          
          <div className="field">
            <label className="field-label">Current Classes</label>
            {isEditing ? (
     <>
       <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
         <input
           className="field-input"
           type="text"
           placeholder="e.g., EECS 280"
           value={newCurrentClass}
           onChange={(e) => setNewCurrentClass(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === "Enter") {
               addClassTo("classes_taking", newCurrentClass);
               setNewCurrentClass("");
             }
           }}
         />
         <button
           className="btn btn-secondary"
           type="button"
           onClick={() => {
             addClassTo("classes_taking", newCurrentClass);
             setNewCurrentClass("");
           }}
         >
           Add
         </button>
       </div>
       <div className="classes-list">
         {(editData.classes_taking || []).map((cls, idx) => (
           <div key={idx} className="class-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
             <span>{cls}</span>
             <button
               type="button"
               onClick={() => removeClassAt("classes_taking", idx)}
               style={{
                 border: "none",
                 background: "transparent",
                 color: "currentColor",
                 cursor: "pointer",
                 fontWeight: 900,
               }}
               aria-label={`Remove ${cls}`}
               title="Remove"
             >
               ×
             </button>
           </div>
         ))}
         {(editData.classes_taking || []).length === 0 && (
           <span className="no-classes">No current classes listed</span>
         )}
       </div>
     </>
   ) : (
     <div className="field-value">
       {user?.classes_taking && user.classes_taking.length > 0 ? (
         <div className="classes-list">
           {user.classes_taking.map((cls, index) => (
             <div key={index} className="class-tag">{cls}</div>
           ))}
         </div>
       ) : (
         <span className="no-classes">No current classes listed</span>
       )}
     </div>
   )}
          </div>

          <div className="field">
            <label className="field-label">Past Classes</label>
            {isEditing ? (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            className="field-input"
            type="text"
            placeholder="e.g., MATH 215"
            value={newPastClass}
            onChange={(e) => setNewPastClass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addClassTo("classes_taken", newPastClass);
                setNewPastClass("");
              }
            }}
          />
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              addClassTo("classes_taken", newPastClass);
              setNewPastClass("");
            }}
          >
            Add
          </button>
        </div>

        <div className="classes-list">
          {(editData.classes_taken || []).map((cls, idx) => (
            <div
              key={idx}
              className="class-tag"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span>{cls}</span>
              <button
                type="button"
                onClick={() => removeClassAt("classes_taken", idx)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "currentColor",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
                aria-label={`Remove ${cls}`}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}

          {(editData.classes_taken || []).length === 0 && (
            <span className="no-classes">No past classes listed</span>
          )}
        </div>
      </>
    ) : (
      <div className="field-value">
        {user?.classes_taken && user.classes_taken.length > 0 ? (
          <div className="classes-list">
            {user.classes_taken.map((cls, index) => (
              <div key={index} className="class-tag">
                {cls}
              </div>
            ))}
          </div>
        ) : (
          <span className="no-classes">No past classes listed</span>
        )}
      </div>
    )}
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Matching Preferences</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', fontStyle: 'italic', padding: '0 12px' }}>
            These are soft preferences that recommend similar people higher in your results. All users are still shown - preferences only affect the order, not who you can see.
          </p>
          
          <div className="field" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ marginBottom: '4px' }}>Prioritize Same Gender</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Recommend people with the same gender higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_gender ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_gender')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_gender')}
                aria-label="Toggle match by gender"
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  background: preferences.match_by_gender ? 'var(--maize)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${preferences.match_by_gender ? 'var(--maize)' : 'rgba(255,255,255,.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.match_by_gender ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>
          </div>

          <div className="field" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ marginBottom: '4px' }}>Prioritize Same Major</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Recommend people with the same major higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_major ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_major')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_major')}
                aria-label="Toggle match by major"
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  background: preferences.match_by_major ? 'var(--maize)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${preferences.match_by_major ? 'var(--maize)' : 'rgba(255,255,255,.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.match_by_major ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>
          </div>

          <div className="field" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ marginBottom: '4px' }}>Prioritize Same Academic Year</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Recommend people in the same year higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_academic_year ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_academic_year')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_academic_year')}
                aria-label="Toggle match by academic year"
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  background: preferences.match_by_academic_year ? 'var(--maize)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${preferences.match_by_academic_year ? 'var(--maize)' : 'rgba(255,255,255,.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.match_by_academic_year ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>
          </div>

          <div className="field" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ marginBottom: '4px' }}>Prioritize Similar Study Preferences</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Recommend people with similar study habits higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_study_preferences ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_study_preferences')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_study_preferences')}
                aria-label="Toggle match by study preferences"
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  background: preferences.match_by_study_preferences ? 'var(--maize)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${preferences.match_by_study_preferences ? 'var(--maize)' : 'rgba(255,255,255,.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.match_by_study_preferences ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>
          </div>

          <div className="field" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label" style={{ marginBottom: '4px' }}>Prioritize Similar Classes</label>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Recommend people taking similar classes higher</div>
              </div>
              <div 
                className={`toggle-switch ${preferences.match_by_classes ? 'active' : ''}`}
                onClick={() => handlePreferenceChange('match_by_classes')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePreferenceChange('match_by_classes')}
                aria-label="Toggle match by classes"
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  background: preferences.match_by_classes ? 'var(--maize)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${preferences.match_by_classes ? 'var(--maize)' : 'rgba(255,255,255,.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.match_by_classes ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSavePreferences}
              disabled={isSavingPreferences}
              style={{ width: 'auto', padding: '10px 24px' }}
            >
              {isSavingPreferences ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>

          </div>
        </div>

        <div className="button-group">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Back
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
