import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUsersList, selectStudyBuddy } from "./authService";
import ProfileButton from "./ProfileButton";
import UserProfileModal from "./UserProfileModal";
import collageUrl from "./assets/collage.jpg";

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectionMessage, setSelectionMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]); // full unfiltered list
  const [filters, setFilters] = useState({
    major: "",
    course: "",
    gender: "",   // "", "male", "female", "non-binary"
    yapRatio: "",       // "", "Low yap", "Balanced", "High yap"
    year: ""        // "", "freshman" | "sophomore" | "junior" | "senior" | "graduate"
  });

  const parseYapPercent = (val) => {
    if (val == null) return null;
    const s = String(val).trim();
    if (/^\d{1,3}$/.test(s)) return parseInt(s, 10);
    const m = s.match(/(\d{1,3})\s*%?\s*yap/i);
    if (m) return parseInt(m[1], 10);
    const f = parseFloat(s);
    if (!Number.isNaN(f)) {
      if (f <= 1) return Math.round(f * 100);
      return Math.round(f);
    }
    return null;
  };


  const applyFilters = () => {
    const majorQ  = filters.major.trim().toLowerCase();
    const courseQ = filters.course.trim().toLowerCase();
    const genderQ = filters.gender.trim().toLowerCase();
    const yapSel  = filters.yapRatio ? parseInt(filters.yapRatio, 10) : null;
    const yearQ   = filters.year.trim().toLowerCase();   // <— add

    const filtered = allUsers.filter(u => {
      const genderOk = !genderQ || (u.gender && u.gender.toLowerCase() === genderQ);
      const majorOk  = !majorQ  || (u.major && u.major.toLowerCase().includes(majorQ));
    
      const classes  = Array.isArray(u.classes_taking) ? u.classes_taking : [];
      const courseOk = !courseQ || classes.some(c => String(c).toLowerCase().includes(courseQ));
    
      const userYap  = parseYapPercent(u.yap_to_study_ratio);
      const yapOk    = !yapSel || (userYap !== null && userYap === yapSel);
    
      // be lenient: match by substring so "First-year" or "Senior (4th)" still works
      const yearVal  = (u.academic_year || "").toLowerCase();
      const yearOk   = !yearQ || yearVal.includes(yearQ);   // <— add
    
      return genderOk && majorOk && courseOk && yapOk && yearOk;
    });

    setUsers(filtered);
    setIsFilterOpen(false);
  };


  const clearFilters = () => {
    setFilters({ major: "", course: "", gender: "", yapRatio: "", year: "" });
    setUsers(allUsers);
    setIsFilterOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/", { replace: true });
  };

  const loadUsers = async (cursor = null, append = false) => {
  try {
    if (append) setLoadingMore(true); else { setLoading(true); setError(""); }

    const response = await getUsersList(cursor);
    const newUsers = response.data.items || [];

    if (append) {
      setAllUsers(prev => [...prev, ...newUsers]);
      // if filters are active, re-apply after appending
      setUsers(prev => {
        const merged = [...prev, ...newUsers];
        // safer: re-filter from allUsers to avoid drift
        setTimeout(applyFilters, 0);
        return merged;
      });
    } else {
      setAllUsers(newUsers);
      setUsers(newUsers);
    }

    setHasMore(response.data.has_more);
    setNextCursor(response.data.next_cursor);
  } catch (err) {
    console.error("Error loading users:", err);
    setError(err.response?.data?.detail || "Failed to load users");
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};


  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSelectUser = async (userId) => {
    try {
      await selectStudyBuddy(userId);
      setSelectedUsers(prev => new Set([...prev, userId]));
      setSelectionMessage("Study buddy selected! We'll notify them if they're interested too.");
      setTimeout(() => setSelectionMessage(""), 3000);
    } catch (err) {
      console.error("Error selecting user:", err);
      setSelectionMessage(err.response?.data?.detail || "Failed to select study buddy");
      setTimeout(() => setSelectionMessage(""), 3000);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadUsers(nextCursor, true);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  
  if (loading) {
    return (
      <div className="user-list-container">
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

          .user-list-container{
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
            padding:20px;
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
        <div className="loading">Loading study buddies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list-container">
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

          .user-list-container{
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
            padding:20px;
          }

          .error {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            font-size: 18px;
            color: #dc3545;
            text-align: center;
          }
        `}</style>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
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

        .user-list-container{
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
          padding:20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .title {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 900;
          color: var(--maize);
          margin: 0 0 10px 0;
        }

        .subtitle {
          color: var(--muted);
          font-size: 16px;
          margin: 0;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .user-card {
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 18px;
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,.3);
        }

        .user-card.selected {
          border-color: var(--maize);
          background: linear-gradient(180deg, rgba(255,205,0,.1), rgba(255,205,0,.05));
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--maize), #ff6b35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: #111;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 18px;
          font-weight: 800;
          color: var(--fg);
          margin: 0 0 5px 0;
        }

        .user-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .profile-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: default;
        }

        .major-badge {
          background: linear-gradient(135deg, rgba(255,205,0,.2), rgba(255,205,0,.1));
          color: var(--maize);
          border: 1px solid rgba(255,205,0,.3);
        }

        .year-badge {
          background: linear-gradient(135deg, rgba(255,107,53,.2), rgba(255,107,53,.1));
          color: #ff6b35;
          border: 1px solid rgba(255,107,53,.3);
        }


        .badge-icon {
          font-size: 12px;
          line-height: 1;
        }

        .badge-text {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .user-study-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,.1);
        }

        .study-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }

        .study-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: rgba(255,255,255,.03);
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,.05);
        }

        .study-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--maize);
          flex-shrink: 0;
        }

        .study-text {
          font-size: 11px;
          color: var(--fg);
          font-weight: 500;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .user-classes {
          margin-top: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .user-classes-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--maize);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .user-classes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
        }

        .user-class-tag {
          background: linear-gradient(135deg, rgba(255,205,0,.25), rgba(255,107,53,.15));
          color: var(--maize);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid rgba(255,205,0,.3);
          white-space: nowrap;
        }

        .view-button {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border-radius: 10px;
          border: 0;
          background: var(--maize);
          color: #111;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-button:hover {
          background: #e6b800;
          transform: translateY(-1px);
        }

        .load-more {
          text-align: center;
          margin-top: 30px;
        }

        .load-more-button {
          padding: 12px 24px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.3);
          background: transparent;
          color: var(--fg);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .load-more-button:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .load-more-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .no-users {
          text-align: center;
          color: var(--muted);
          font-size: 18px;
          margin-top: 50px;
        }

        .logout-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.3);
          background: transparent;
          color: var(--fg);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 1000;
        }

        .logout-button:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .subtitle-row{
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        /* pushes button to the far right of the same line as the subtitle */
        .subtitle-row .subtitle{
          margin: 0 auto;
          text-align: center;
          width: 100%;
        }

        .filter-trigger{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.25);
          background:rgba(255,255,255,.06);
          color:var(--fg);
          font-weight:800;
          cursor:pointer;
          transition:all .2s ease;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
        }
        .filter-trigger:hover{
          background:rgba(255,255,255,.12);
          border-color:var(--maize);
        }
        .filter-trigger .chev{ font-size:12px; opacity:.9; }

        .filter-dropdown{
          position:absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 230px;                 /* was 280px */
          background: rgba(14,14,16,.95);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 10px;          /* slightly tighter */
          box-shadow: 0 10px 24px rgba(0,0,0,.40);
          backdrop-filter: blur(8px);
          padding: 10px;                /* tighter padding */
          z-index: 10;
        }

        .filter-row{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:10px;
          align-items:center;
          margin-bottom:10px;
        }
        .filter-row label{
          font-size:14px;
          color:var(--muted);
        }
        .filter-row select,
        .filter-input{
          width:100%;
          background: rgba(255,255,255,.08);
          color: var(--fg);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 8px;
          padding:8px 10px;
          font-weight:700;
          font-size:13px;
        }

        .filter-actions{
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:6px;
        }
        .filter-actions .ghost{
          background:transparent;
          border:1px solid rgba(255,255,255,.25);
          color:var(--fg);
          border-radius:8px;
          padding:6px 10px;
          cursor:pointer;
        }
        .filter-actions .apply{
          background: var(--maize);
          color:#111;
          border:0;
          border-radius:8px;
          padding:6px 12px;
          font-weight:800;
          cursor:pointer;
        }
        .filter-row select:focus,
        .filter-input:focus{
          outline: none;
          border-color: var(--maize);
          box-shadow: 0 0 0 3px rgba(255,205,0,.15);
        }
      `}</style>

      <ProfileButton />
      
      <button className="logout-button" onClick={handleLogout}>
        Log out
      </button>

      <div className="header">
        <h1 className="title">Find Your Study Buddy</h1>
        <div className="subtitle-row" ref={filterRef}>
    <p className="subtitle">Meet a study buddy and see if they're a good fit!</p>

    <button
      className="filter-trigger"
      aria-haspopup="menu"
      aria-expanded={isFilterOpen}
      onClick={(e) => {
        e.stopPropagation();
        setIsFilterOpen((v) => !v);
      }}
    >
      <span>Filter</span>
      <span className="chev">▾</span>
    </button>

    {isFilterOpen && (
  <div className="filter-dropdown" role="menu">
    <div className="filter-row">
      <label htmlFor="f-major">Major</label>
      <input
        id="f-major"
        className="filter-input"
        type="text"
        placeholder="e.g., Computer Science"
        value={filters.major}
        onChange={(e) => setFilters(f => ({ ...f, major: e.target.value }))}
      />
    </div>

    <div className="filter-row">
      <label htmlFor="f-course">Course</label>
      <input
        id="f-course"
        className="filter-input"
        type="text"
        placeholder="e.g., EECS 280"
        value={filters.course}
        onChange={(e) => setFilters(f => ({ ...f, course: e.target.value }))}
      />
    </div>

    <div className="filter-row">
      <label htmlFor="f-year">Year</label>
      <select
        id="f-year"
        value={filters.year}
        onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
      >
        <option value="">Any</option>
        <option value="freshman">Freshman</option>
        <option value="sophomore">Sophomore</option>
        <option value="junior">Junior</option>
        <option value="senior">Senior</option>
        <option value="graduate">Graduate</option>
      </select>
    </div>

    <div className="filter-row">
      <label htmlFor="f-gender">Gender</label>
      <select
        id="f-gender"
        value={filters.gender}
        onChange={(e) => setFilters(f => ({ ...f, gender: e.target.value }))}
      >
        <option value="">Any</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="non-binary">Non-binary</option>
      </select>
    </div>

    <div className="filter-row">
      <label htmlFor="f-yap">Yap/Study</label>
      <select
        id="f-yap"
        value={filters.yapRatio}
        onChange={(e) => setFilters(f => ({ ...f, yapRatio: e.target.value }))}
      >
        <option value="">Any</option>
        <option value="10">10% yap, 90% study</option>
        <option value="20">20% yap, 80% study</option>
        <option value="30">30% yap, 70% study</option>
        <option value="40">40% yap, 60% study</option>
        <option value="50">50% yap, 50% study</option>
      </select>
    </div>


    <div className="filter-actions">
      <button className="ghost" onClick={clearFilters}>Clear</button>
      <button className="apply" onClick={applyFilters}>Apply</button>
    </div>
  </div>
)}

  </div>
      </div>

      {selectionMessage && (
        <div className="message">{selectionMessage}</div>
      )}

      {users.length === 0 ? (
        <div className="no-users">
          No study buddies found. Check back later!
        </div>
      ) : (
        <>
          <div className="users-grid">
            {users.map((user) => (
              <div 
                key={user.id} 
                className={`user-card ${selectedUsers.has(user.id) ? 'selected' : ''}`}
              >
                <div className="user-header">
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.name || 'Anonymous'}</h3>
                    <div className="user-badges">
                      {user.major && (
                        <div className="profile-badge major-badge" title={`Major: ${user.major}`}>
                          <span className="badge-icon">🎓</span>
                          <span className="badge-text">{user.major}</span>
                        </div>
                      )}
                      {user.academic_year && (
                        <div className="profile-badge year-badge" title={`Year: ${user.academic_year}`}>
                          <span className="badge-icon">📅</span>
                          <span className="badge-text">{user.academic_year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="user-study-info">
                {user.classes_taking && user.classes_taking.length > 0 && (
                    <div className="user-classes">
                      <div className="user-classes-label">
                        📚 Currently taking:
                      </div>
                      <div className="user-classes-list">
                        {user.classes_taking.slice(0, 4).map((cls, index) => (
                          <div key={index} className="user-class-tag">{cls}</div>
                        ))}
                        {user.classes_taking.length > 4 && (
                          <div className="user-class-tag">+{user.classes_taking.length - 4}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="study-grid">
                    {user.learn_best_when && (
                      <div className="study-item">
                        <div className="study-icon">⏰</div>
                        <div className="study-text" title={user.learn_best_when}>
                          {user.learn_best_when.length > 20 
                            ? user.learn_best_when.substring(0, 20) + '...' 
                            : user.learn_best_when}
                        </div>
                      </div>
                    )}
                    {user.study_snack && (
                      <div className="study-item">
                        <div className="study-icon">🍿</div>
                        <div className="study-text" title={user.study_snack}>
                          {user.study_snack.length > 15 
                            ? user.study_snack.substring(0, 15) + '...' 
                            : user.study_snack}
                        </div>
                      </div>
                    )}
                    {user.favorite_study_spot && (
                      <div className="study-item">
                        <div className="study-icon">📍</div>
                        <div className="study-text" title={user.favorite_study_spot}>
                          {user.favorite_study_spot.length > 15 
                            ? user.favorite_study_spot.substring(0, 15) + '...' 
                            : user.favorite_study_spot}
                        </div>
                      </div>
                    )}
                    {user.mbti && (
                      <div className="study-item">
                        <div className="study-icon">🧠</div>
                        <div className="study-text">{user.mbti}</div>
                      </div>
                    )}
                    {user.yap_to_study_ratio && (
                      <div className="study-item">
                        <div className="study-icon">💬</div>
                        <div className="study-text" title={user.yap_to_study_ratio}>
                          {user.yap_to_study_ratio.length > 20 
                            ? user.yap_to_study_ratio.substring(0, 20) + '...' 
                            : user.yap_to_study_ratio}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="view-button"
                  onClick={() => handleViewProfile(user)}
                >
                  View Full Profile
                </button>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button
                className="load-more-button"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      <UserProfileModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
