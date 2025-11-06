import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getConnections,
  markConnectionMet,
  getRatingCriteria,
  submitRating,
} from "./authService";
import { useSidebar } from "./SidebarContext";
import collageUrl from "./assets/collage.jpg";

export default function Connections() {
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const [connections, setConnections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showMetDialog, setShowMetDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingCriteria, setRatingCriteria] = useState([]);
  const [ratings, setRatings] = useState({});
  const [reflectionNote, setReflectionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await getConnections();
      setConnections(response.data);
      setError("");
    } catch (err) {
      console.error("Error loading connections:", err);
      setError("Failed to load connections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMet = async (reachOutId, met, connection) => {
    try {
      await markConnectionMet(reachOutId, met);
      await loadConnections();
      setShowMetDialog(false);
      
      // If they met, automatically open the rating dialog
      if (met && connection) {
        await handleOpenRating(connection);
      } else {
        setSelectedConnection(null);
      }
    } catch (err) {
      console.error("Error marking connection:", err);
      setError(err.response?.data?.detail || "Failed to update connection status.");
    }
  };

  const handleOpenRating = async (connection) => {
    try {
      setSelectedConnection(connection);
      const response = await getRatingCriteria(connection.reach_out_id);
      setRatingCriteria(response.data.criteria);
      setRatings({});
      setReflectionNote("");
      setShowRatingDialog(true);
    } catch (err) {
      console.error("Error loading rating criteria:", err);
      setError(err.response?.data?.detail || "Failed to load rating criteria.");
    }
  };

  const areAllRatingsComplete = () => {
    if (ratingCriteria.length !== 3) return false;
    return ratingCriteria.every(criterion => {
      const rating = ratings[criterion];
      return rating !== undefined && rating >= 1 && rating <= 5;
    });
  };

  const handleSubmitRating = async () => {
    if (!selectedConnection) return;

    // Validate ratings
    if (ratingCriteria.length !== 3) {
      setError("Invalid rating criteria.");
      return;
    }

    const ratingValues = [
      ratings[ratingCriteria[0]] || 0,
      ratings[ratingCriteria[1]] || 0,
      ratings[ratingCriteria[2]] || 0,
    ];

    if (ratingValues.some((r) => r < 1 || r > 5)) {
      setError("Please provide ratings (1-5) for all criteria.");
      return;
    }

    try {
      setSubmitting(true);
      await submitRating(
        selectedConnection.reach_out_id,
        ratingCriteria,
        ratingValues,
        reflectionNote || null
      );
      await loadConnections();
      setShowRatingDialog(false);
      setSelectedConnection(null);
      setRatings({});
      setReflectionNote("");
      setError("");
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError(err.response?.data?.detail || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--fg)" }}>
        <p>Loading connections...</p>
      </div>
    );
  }

  return (
    <>
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
          --sidebar-width: ${isOpen ? '260px' : '70px'};
        }
        * { box-sizing: border-box; }
        body { margin:0; }

        .connections-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 100vh;
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

        .connections-container {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding: 20px 20px 20px calc(var(--sidebar-width) + 20px);
          color: var(--fg);
          font-family: var(--font);
          min-height: 100vh;
          transition: padding-left 0.3s ease;
          box-sizing: border-box;
        }

        @media (max-width: 1000px) {
          .connections-container {
            margin-left: var(--sidebar-width);
            padding-left: 12px;
          }
        }

        @media (max-width: 768px) {
          .connections-container {
            margin-left: 0;
            padding: 70px 12px 20px 12px;
          }
        }

        .connections-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 20px 20px 20px 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .connections-title {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 900;
          margin-bottom: 8px;
          color: var(--maize);
          line-height: 1.2;
          text-shadow: 0 2px 20px rgba(255, 205, 0, 0.3);
        }

        .connections-subtitle {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
        }

        .error-message {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          color: #ff6b6b;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-family: var(--font);
          font-weight: 600;
        }

        .connections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .connections-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .connection-section {
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .connection-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,.3);
        }

        .section-title {
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 12px;
          color: var(--maize);
          font-family: var(--font);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .connection-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .connection-item {
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .connection-item:hover {
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
          border-color: var(--maize);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0,0,0,.2);
        }

        .connection-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          justify-content: space-between;
        }

        .connection-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--maize), #ff6b35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
          color: #111;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(255, 205, 0, 0.3);
        }

        .connection-info {
          flex: 1;
          min-width: 0;
        }

        .connection-name {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 4px;
          color: var(--fg);
          font-family: var(--font);
        }

        .connection-email {
          font-size: 12px;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--font);
        }

        .connection-meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .connection-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.45rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .connection-badge.met {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        .connection-badge.not-met {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }

        .connection-badge.rated {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
        }

        .connection-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0;
          align-items: center;
          flex-shrink: 0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-family: var(--font);
        }

        .btn-primary {
          background: var(--maize);
          color: #111;
          font-weight: 800;
        }

        .btn-primary:hover {
          background: #e6b800;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 205, 0, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: var(--fg);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .dialog {
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 20px;
          max-width: 450px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,.4);
          font-family: var(--font);
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .dialog::-webkit-scrollbar {
          display: none;
        }

        .dialog-title {
          font-size: clamp(18px, 3vw, 22px);
          font-weight: 900;
          margin-bottom: 12px;
          color: var(--maize);
          font-family: var(--font);
          line-height: 1.2;
        }

        .dialog-content {
          margin-bottom: 16px;
          color: var(--fg);
          font-size: 13px;
          line-height: 1.4;
          font-family: var(--font);
        }

        .dialog-content p {
          margin: 0;
          color: var(--fg);
        }

        .dialog-content strong {
          color: var(--maize);
          font-weight: 800;
        }

        .dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .rating-criterion {
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .rating-label {
          font-weight: 700;
          text-transform: capitalize;
          color: var(--fg);
          font-size: 13px;
          font-family: var(--font);
          flex-shrink: 0;
          min-width: 0;
        }

        .rating-stars {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .star-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--fg);
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font);
        }

        .star-btn:hover {
          border-color: var(--maize);
          background: rgba(255, 205, 0, 0.15);
          transform: translateY(-1px);
        }

        .star-btn.active {
          background: var(--maize);
          border-color: var(--maize);
          color: #111;
          box-shadow: 0 4px 12px rgba(255, 205, 0, 0.3);
        }

        .reflection-textarea {
          width: 100%;
          min-height: 70px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.08);
          color: var(--fg);
          font-family: var(--font);
          font-size: 13px;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .reflection-textarea:focus {
          outline: none;
          border-color: var(--maize);
          box-shadow: 0 0 0 3px rgba(255,205,0,.15);
          background: rgba(255, 255, 255, 0.1);
        }

        .reflection-textarea::placeholder {
          color: var(--muted);
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          opacity: 0.6;
        }
      `}</style>

      <div className="connections-wrapper">
        <div className="connections-container">
        <div className="connections-header">
          <h1 className="connections-title">My Connections</h1>
          <p className="connections-subtitle">
            View and rate your study buddy connections
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="connections-grid">
          <div className="connection-section">
            <h2 className="section-title">I Reached Out To</h2>
            <div className="connection-list">
              {connections?.reached_out_to?.length > 0 ? (
                connections.reached_out_to.map((conn) => (
                  <div 
                    key={conn.id} 
                    className="connection-item"
                    onClick={() => {
                      if (conn.met === null) {
                        setSelectedConnection(conn);
                        setShowMetDialog(true);
                      } else if (conn.met === true && !conn.has_rating) {
                        handleOpenRating(conn);
                      }
                    }}
                  >
                    <div className="connection-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div className="connection-avatar">
                          {conn.name
                            ? conn.name.charAt(0).toUpperCase()
                            : conn.school_email?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="connection-info">
                          <div className="connection-name">
                            {conn.name || conn.school_email || "Unknown"}
                          </div>
                          <div className="connection-email">{conn.school_email}</div>
                        </div>
                      </div>
                      <div className="connection-actions" onClick={(e) => e.stopPropagation()}>
                        {conn.met === null && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setSelectedConnection(conn);
                              setShowMetDialog(true);
                            }}
                          >
                            Did you meet?
                          </button>
                        )}
                        {conn.met === true && !conn.has_rating && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenRating(conn)}
                          >
                            Rate Session
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="connection-meta">
                      <span className="connection-badge">
                        {formatDate(conn.created_at)}
                      </span>
                      {conn.met === true && (
                        <span className="connection-badge met">Met</span>
                      )}
                      {conn.met === false && (
                        <span className="connection-badge not-met">Didn't Meet</span>
                      )}
                      {conn.has_rating && (
                        <span className="connection-badge rated">Rated</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No connections yet</div>
              )}
            </div>
          </div>

          <div className="connection-section">
            <h2 className="section-title">Reached Out To Me</h2>
            <div className="connection-list">
              {connections?.reached_out_by?.length > 0 ? (
                connections.reached_out_by.map((conn) => (
                  <div 
                    key={conn.id} 
                    className="connection-item"
                    onClick={() => {
                      if (conn.met === null) {
                        setSelectedConnection(conn);
                        setShowMetDialog(true);
                      } else if (conn.met === true && !conn.has_rating) {
                        handleOpenRating(conn);
                      }
                    }}
                  >
                    <div className="connection-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div className="connection-avatar">
                          {conn.name
                            ? conn.name.charAt(0).toUpperCase()
                            : conn.school_email?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="connection-info">
                          <div className="connection-name">
                            {conn.name || conn.school_email || "Unknown"}
                          </div>
                          <div className="connection-email">{conn.school_email}</div>
                        </div>
                      </div>
                      <div className="connection-actions" onClick={(e) => e.stopPropagation()}>
                        {conn.met === null && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setSelectedConnection(conn);
                              setShowMetDialog(true);
                            }}
                          >
                            Did you meet?
                          </button>
                        )}
                        {conn.met === true && !conn.has_rating && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenRating(conn)}
                          >
                            Rate Session
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="connection-meta">
                      <span className="connection-badge">
                        {formatDate(conn.created_at)}
                      </span>
                      {conn.met === true && (
                        <span className="connection-badge met">Met</span>
                      )}
                      {conn.met === false && (
                        <span className="connection-badge not-met">Didn't Meet</span>
                      )}
                      {conn.has_rating && (
                        <span className="connection-badge rated">Rated</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No connections yet</div>
              )}
            </div>
          </div>
        </div>
        </div>

      {/* Mark Met Dialog */}
      {showMetDialog && selectedConnection && (
        <div className="dialog-overlay" onClick={() => setShowMetDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">Did you meet?</h2>
            <div className="dialog-content">
              <p>
                Did you actually meet with{" "}
                <strong>
                  {selectedConnection.name || selectedConnection.school_email}
                </strong>
                ?
              </p>
            </div>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMetDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  handleMarkMet(selectedConnection.reach_out_id, false, selectedConnection)
                }
              >
                No, didn't meet
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleMarkMet(selectedConnection.reach_out_id, true, selectedConnection)
                }
              >
                Yes, we met
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Dialog */}
      {showRatingDialog && selectedConnection && (
        <div className="dialog-overlay" onClick={() => setShowRatingDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">Quick Feedback</h2>
            <div className="dialog-content">
              <p style={{ marginBottom: '16px', opacity: 0.9 }}>
                How did it go with{" "}
                <strong>
                  {selectedConnection.name || selectedConnection.school_email}
                </strong>?
              </p>

              {ratingCriteria.map((criterion, idx) => (
                <div key={idx} className="rating-criterion">
                  <div className="rating-label">{criterion}</div>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`star-btn ${
                          ratings[criterion] >= star ? "active" : ""
                        }`}
                        onClick={() =>
                          setRatings({ ...ratings, [criterion]: star })
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "16px" }}>
                <label
                  htmlFor="reflection"
                  style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: 700,
                    color: "var(--muted)",
                    fontSize: "12px",
                    fontFamily: "var(--font)"
                  }}
                >
                  Personal notes (optional):
                </label>
                <textarea
                  id="reflection"
                  className="reflection-textarea"
                  placeholder="For your own reflection, what made this session work well?"
                  value={reflectionNote}
                  onChange={(e) => setReflectionNote(e.target.value)}
                />
              </div>
            </div>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRatingDialog(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitRating}
                disabled={submitting || !areAllRatingsComplete()}
              >
                {submitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

