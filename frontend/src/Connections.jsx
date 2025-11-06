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

  const handleMarkMet = async (reachOutId, met) => {
    try {
      await markConnectionMet(reachOutId, met);
      await loadConnections();
      setShowMetDialog(false);
      setSelectedConnection(null);
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
          margin-top: 0.75rem;
        }

        .btn {
          padding: 0.45rem 0.9rem;
          border-radius: 6px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.8rem;
        }

        .btn-primary {
          background: var(--maize);
          color: #111;
        }

        .btn-primary:hover {
          background: #ffd54f;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--fg);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
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
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .dialog {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .dialog-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--maize);
        }

        .dialog-content {
          margin-bottom: 1.5rem;
        }

        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .rating-criterion {
          margin-bottom: 1.5rem;
        }

        .rating-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: capitalize;
        }

        .rating-stars {
          display: flex;
          gap: 0.5rem;
        }

        .star-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: var(--fg);
          width: 40px;
          height: 40px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.25rem;
        }

        .star-btn:hover {
          border-color: var(--maize);
          background: rgba(255, 203, 5, 0.1);
        }

        .star-btn.active {
          background: var(--maize);
          border-color: var(--maize);
          color: #111;
        }

        .reflection-textarea {
          width: 100%;
          min-height: 100px;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: var(--fg);
          font-family: var(--font);
          font-size: 0.875rem;
          resize: vertical;
        }

        .reflection-textarea:focus {
          outline: none;
          border-color: var(--maize);
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
                  <div key={conn.id} className="connection-item">
                    <div className="connection-header">
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
                    <div className="connection-actions">
                      {conn.met === null && (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setSelectedConnection(conn);
                              setShowMetDialog(true);
                            }}
                          >
                            Mark Status
                          </button>
                        </>
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
                  <div key={conn.id} className="connection-item">
                    <div className="connection-header">
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
                    <div className="connection-actions">
                      {conn.met === null && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedConnection(conn);
                            setShowMetDialog(true);
                          }}
                        >
                          Mark Status
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
                  handleMarkMet(selectedConnection.reach_out_id, false)
                }
              >
                No, didn't meet
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleMarkMet(selectedConnection.reach_out_id, true)
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
            <h2 className="dialog-title">Rate Study Session</h2>
            <div className="dialog-content">
              <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
                Rate{" "}
                <strong>
                  {selectedConnection.name || selectedConnection.school_email}
                </strong>{" "}
                on the following criteria:
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

              <div style={{ marginTop: "2rem" }}>
                <label
                  htmlFor="reflection"
                  style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}
                >
                  What made this session work well? (Optional)
                </label>
                <textarea
                  id="reflection"
                  className="reflection-textarea"
                  placeholder="Share your thoughts..."
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
                disabled={submitting}
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

