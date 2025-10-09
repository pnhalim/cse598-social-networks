import { useState, useEffect } from "react";
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

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/", { replace: true });
  };

  const loadUsers = async (cursor = null, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      const response = await getUsersList(cursor);
      const newUsers = response.data.items || [];
      
      if (append) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
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
      `}</style>

      <ProfileButton />
      
      <button className="logout-button" onClick={handleLogout}>
        Log out
      </button>

      <div className="header">
        <h1 className="title">Find Your Study Buddy</h1>
        <p className="subtitle">Meet a study buddy and see if they're a good fit!</p>
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
