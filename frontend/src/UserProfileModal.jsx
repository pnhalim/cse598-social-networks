import { useState, useEffect } from "react";
import collageUrl from "./assets/collage.jpg";
import { reachOut, me, reportUser, getReachOutStatus } from "./authService";
import { validateTextInput } from "./censorshipUtils";

export default function UserProfileModal({ user, isOpen, onClose }) {
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' or 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [reachOutStatus, setReachOutStatus] = useState(null);
  const [messageError, setMessageError] = useState("");

  // Load current user and reach out status when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [userResponse, statusResponse] = await Promise.all([
            me(),
            getReachOutStatus()
          ]);
          setCurrentUser(userResponse.data);
          setReachOutStatus(statusResponse.data);
        } catch (err) {
          console.error('Failed to load data:', err);
          // Still try to load user even if status fails
          try {
            const userResponse = await me();
            setCurrentUser(userResponse.data);
          } catch (userErr) {
            console.error('Failed to load current user:', userErr);
          }
        }
      };
      loadData();
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleReachOut = () => {
    setShowEmailPopup(true);
    setPersonalMessage("");
    setSendStatus(null);
    setErrorMessage("");
  };

  const handleSendEmail = async () => {
    if (!currentUser) {
      setErrorMessage("Unable to load your profile. Please try again.");
      return;
    }

    // Check for inappropriate content before sending
    if (messageError) {
      setSendStatus('error');
      setErrorMessage(messageError);
      return;
    }

    setIsSending(true);
    setSendStatus(null);
    setErrorMessage("");

    try {
      const response = await reachOut(user.id, personalMessage || null);
      setSendStatus('success');
      
      // Update reach out status if provided in response
      if (response.data?.remaining_reach_outs !== undefined) {
        setReachOutStatus(prev => ({
          ...prev,
          today_count: (prev?.today_count || 0) + 1,
          remaining: response.data.remaining_reach_outs,
          can_reach_out: response.data.remaining_reach_outs > 0
        }));
      } else {
        // Refresh status if not in response
        try {
          const statusResponse = await getReachOutStatus();
          setReachOutStatus(statusResponse.data);
        } catch (statusErr) {
          console.error('Failed to refresh reach out status:', statusErr);
        }
      }
      
      // Close popup after 2 seconds
      setTimeout(() => {
        setShowEmailPopup(false);
        setPersonalMessage("");
        setSendStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to send email:', err);
      setSendStatus('error');
      setErrorMessage(
        err.response?.data?.detail || 
        err.message || 
        "Failed to send email. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const closeEmailPopup = () => {
    setShowEmailPopup(false);
    setEmailCopied(false);
    setPersonalMessage("");
    setSendStatus(null);
    setErrorMessage("");
  };

  const handleReportClick = () => {
    setShowReportDialog(true);
  };

  const handleConfirmReport = async () => {
    if (!currentUser) {
      return;
    }

    setIsReporting(true);
    setReportStatus(null);

    try {
      await reportUser(user.id, null, "profile_view");
      setReportStatus('success');
      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowReportDialog(false);
        setReportStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to report user:', err);
      setReportStatus('error');
    } finally {
      setIsReporting(false);
    }
  };

  const handleCancelReport = () => {
    setShowReportDialog(false);
    setReportStatus(null);
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      case 'non-binary':
        return '⚧';
      default:
        return '?';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 16px;
          padding: 20px;
          max-width: 1000px;
          width: 100%;
          max-height: 95vh;
          overflow-y: auto;
          position: relative;
          backdrop-filter: blur(15px);
          color: var(--fg);
          font-family: var(--font);
        }

        .modal-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .modal-sidebar {
          position: sticky;
          top: 10px;
        }

        .modal-main {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .modal-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .modal-sidebar {
            position: static;
          }
        }

        .modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 16px;
          background: linear-gradient(135deg, rgba(255,205,0,.12), rgba(255,107,53,.08));
          border: 1px solid rgba(255,205,0,.3);
          border-radius: 12px;
          backdrop-filter: blur(15px);
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }

        .modal-header::before {
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

        .stats-card {
          background: linear-gradient(135deg, rgba(255,205,0,.08), rgba(255,107,53,.05));
          border: 1px solid rgba(255,205,0,.2);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .stats-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--maize);
          margin: 0 0 8px 0;
          text-align: center;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
        }

        .stat-value {
          color: var(--fg);
          font-size: 12px;
          font-weight: 700;
        }

        .modal-avatar {
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
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
          box-shadow: 0 4px 16px rgba(255,205,0,.3);
          border: 2px solid rgba(255,255,255,.2);
        }

        .modal-user-info h2 {
          font-size: 24px;
          font-weight: 900;
          color: var(--fg);
          margin: 0 0 6px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,.3);
          position: relative;
          z-index: 1;
        }

        .modal-user-info p {
          color: var(--muted);
          margin: 0 0 3px 0;
          font-size: 15px;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }

        .modal-user-info p:last-child {
          color: var(--maize);
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255,205,0,.1);
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          margin-top: 6px;
        }

        .gender-capsule {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, rgba(255,205,0,.15), rgba(255,107,53,.1));
          border: 1px solid rgba(255,205,0,.3);
          border-radius: 12px;
          padding: 4px 8px;
          margin-top: 4px;
          font-size: 13px;
          font-weight: 700;
          color: var(--maize);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gender-icon {
          font-size: 14px;
        }

        .email-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(40, 167, 69, 0.1));
          border: 1px solid rgba(40, 167, 69, 0.4);
          border-radius: 10px;
          padding: 3px 6px;
          margin-top: 4px;
          font-size: 12px;
          font-weight: 700;
          color: #28a745;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .email-badge.pending {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.1));
          border-color: rgba(255, 193, 7, 0.4);
          color: #ffc107;
        }

        .email-icon {
          font-size: 12px;
        }

        .info-capsule {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 10px;
          padding: 3px 6px;
          margin-top: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--fg);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .info-icon {
          font-size: 12px;
          color: var(--muted);
        }


        .modal-section {
          margin-bottom: 0;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 10px;
          padding: 12px;
          transition: all 0.3s ease;
        }

        .modal-section:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(255,255,255,.1);
          transform: translateY(-2px);
        }

        .modal-section-title {
          font-size: 16px;
          font-weight: 900;
          color: var(--maize);
          margin: 0 0 8px 0;
          border-bottom: 2px solid var(--maize);
          padding-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
        }

        .modal-section-title::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, var(--maize), transparent);
        }

        .modal-field {
          margin-bottom: 8px;
          padding: 8px;
          background: rgba(255,255,255,.02);
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,.05);
          transition: all 0.2s ease;
        }

        .modal-field:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(255,255,255,.1);
        }

        .modal-field-label {
          display: block;
          font-weight: 800;
          color: var(--maize);
          font-size: 12px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-field-value {
          color: var(--fg);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.4;
          padding: 1px 0;
        }

        .modal-classes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .modal-class-tag {
          background: linear-gradient(135deg, rgba(255,205,0,.25), rgba(255,107,53,.15));
          color: var(--maize);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid rgba(255,205,0,.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-not-provided {
          color: var(--muted);
          font-style: italic;
          font-size: 14px;
          opacity: 0.7;
        }

        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 20px;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255,255,255,.1);
          color: var(--fg);
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,.1);
        }
        
        .modal-actions-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .modal-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 0;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-btn-primary {
          background: var(--maize);
          color: #111;
        }

        .modal-btn-primary:hover {
          background: #e6b800;
        }

        .modal-btn-secondary {
          background: transparent;
          border: 1px solid rgba(255,255,255,.3);
          color: var(--fg);
        }

        .modal-btn-secondary:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .modal-btn-danger {
          background: transparent;
          border: 1px solid rgba(220, 53, 69, 0.5);
          color: #dc3545;
        }

        .modal-btn-danger:hover {
          background: rgba(220, 53, 69, 0.2);
          border-color: #dc3545;
        }

        .email-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }

        .email-popup {
          background: linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.06));
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          text-align: left;
          backdrop-filter: blur(15px);
          color: var(--fg);
          font-family: var(--font);
          position: relative;
        }
        
        .email-draft-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(255,255,255,.05);
          color: var(--fg);
          font-family: var(--font);
          font-size: 14px;
          resize: vertical;
          margin: 16px 0;
        }
        
        .email-draft-textarea:focus {
          outline: none;
          border-color: var(--maize);
          background: rgba(255,255,255,.08);
        }
        
        .email-draft-textarea::placeholder {
          color: var(--muted);
        }
        
        .status-message {
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .status-message.success {
          background: rgba(40, 167, 69, 0.2);
          border: 1px solid rgba(40, 167, 69, 0.4);
          color: #28a745;
        }
        
        .status-message.error {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.4);
          color: #dc3545;
        }

        .email-popup h3 {
          font-size: 20px;
          font-weight: 900;
          color: var(--maize);
          margin: 0 0 16px 0;
        }

        .email-display {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--fg);
          word-break: break-all;
        }

        .email-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }

        .email-btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: 0;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .email-btn-primary {
          background: var(--maize);
          color: #111;
        }

        .email-btn-primary:hover {
          background: #e6b800;
        }

        .email-btn-secondary {
          background: transparent;
          border: 1px solid rgba(255,255,255,.3);
          color: var(--fg);
        }

        .email-btn-secondary:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .email-btn-danger {
          background: transparent;
          border: 1px solid rgba(220, 53, 69, 0.5);
          color: #dc3545;
        }

        .email-btn-danger:hover {
          background: rgba(220, 53, 69, 0.2);
          border-color: #dc3545;
        }

        .copy-success {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          animation: fadeInOut 2s ease;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          20%, 80% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-layout">
          <div className="modal-sidebar">
            <div className="modal-header">
              <div className="modal-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="modal-user-info">
                <h2>{user.name || 'Anonymous'}</h2>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                  {user.major && (
                    <div className="info-capsule">
                      <span className="info-icon">🎓</span>
                      <span>{user.major}</span>
                    </div>
                  )}
                  {user.academic_year && (
                    <div className="info-capsule">
                      <span className="info-icon">📚</span>
                      <span>{user.academic_year}</span>
                    </div>
                  )}
                  {user.gender && (
                    <div className="gender-capsule">
                      <span className="gender-icon">{getGenderIcon(user.gender)}</span>
                      <span>{user.gender}</span>
                    </div>
                  )}
                  <div className={`email-badge ${user?.email_verified ? '' : 'pending'}`}>
                    <span className="email-icon">✉</span>
                    <span>{user?.email_verified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Classes</h3>
              
              <div className="modal-field">
                <label className="modal-field-label">Current Classes</label>
                <div className="modal-field-value">
                  {user.classes_taking && user.classes_taking.length > 0 ? (
                    <div className="modal-classes-list">
                      {user.classes_taking.map((cls, index) => (
                        <div key={index} className="modal-class-tag">{cls}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="modal-not-provided">No current classes listed</span>
                  )}
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-field-label">Past Classes</label>
                <div className="modal-field-value">
                  {user.classes_taken && user.classes_taken.length > 0 ? (
                    <div className="modal-classes-list">
                      {user.classes_taken.map((cls, index) => (
                        <div key={index} className="modal-class-tag">{cls}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="modal-not-provided">No past classes listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-main">

        <div className="modal-section">
          <h3 className="modal-section-title">Study Preferences</h3>
          
          <div className="modal-field">
            <label className="modal-field-label">I learn best when... 🤓</label>
            <div className="modal-field-value">
              {user.learn_best_when || <span className="modal-not-provided">Not provided</span>}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field-label">My fav study snack 🤤</label>
            <div className="modal-field-value">
              {user.study_snack || <span className="modal-not-provided">Not provided</span>}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field-label">My go-to study spot 📚</label>
            <div className="modal-field-value">
              {user.favorite_study_spot || <span className="modal-not-provided">Not provided</span>}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field-label">My personality type 🧠</label>
            <div className="modal-field-value">
              {user.mbti || <span className="modal-not-provided">Not provided</span>}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field-label">Chat vs Study ratio (be honest) 💬📖</label>
            <div className="modal-field-value">
              {user.yap_to_study_ratio || <span className="modal-not-provided">Not provided</span>}
            </div>
          </div>
        </div>

          </div>
        </div>

        <div className="modal-actions">
          {reachOutStatus && (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--muted)', 
              textAlign: 'center',
              marginBottom: '8px',
              padding: '6px 12px',
              background: reachOutStatus.can_reach_out ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
              border: `1px solid ${reachOutStatus.can_reach_out ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`,
              borderRadius: '6px'
            }}>
              {reachOutStatus.can_reach_out ? (
                <>📧 {reachOutStatus.remaining} of {reachOutStatus.daily_limit} reach outs remaining today</>
              ) : (
                <>⚠️ Daily limit reached ({reachOutStatus.daily_limit}/{reachOutStatus.daily_limit}). Try again tomorrow!</>
              )}
            </div>
          )}
          <div className="modal-actions-buttons">
            <button 
              className="modal-btn modal-btn-primary" 
              onClick={handleReachOut}
              disabled={reachOutStatus && !reachOutStatus.can_reach_out}
              style={{
                opacity: (reachOutStatus && !reachOutStatus.can_reach_out) ? 0.5 : 1,
                cursor: (reachOutStatus && !reachOutStatus.can_reach_out) ? 'not-allowed' : 'pointer'
              }}
            >
              Reach Out
            </button>
            {currentUser && currentUser.id !== user.id && (
              <button className="modal-btn modal-btn-danger" onClick={handleReportClick}>
                ⚠️ Report
              </button>
            )}
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {showEmailPopup && (
        <div className="email-popup-overlay" onClick={closeEmailPopup}>
          <div className="email-popup" onClick={(e) => e.stopPropagation()}>
            <h3>✉️ Reach Out to {user.name || 'This Person'}</h3>
            {reachOutStatus && (
              <div style={{ 
                marginBottom: '12px',
                padding: '8px 12px',
                background: reachOutStatus.can_reach_out ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                border: `1px solid ${reachOutStatus.can_reach_out ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: reachOutStatus.can_reach_out ? '#28a745' : '#dc3545',
                fontWeight: 600
              }}>
                {reachOutStatus.can_reach_out ? (
                  <>📧 {reachOutStatus.remaining} of {reachOutStatus.daily_limit} reach outs remaining today</>
                ) : (
                  <>⚠️ You've reached your daily limit of {reachOutStatus.daily_limit} reach outs. Please try again tomorrow.</>
                )}
              </div>
            )}
            <p style={{ color: 'var(--muted)', margin: '0 0 16px 0', fontSize: '14px' }}>
              Write a quick note (optional) and we'll send an email to {user.name || 'them'} with both of your profiles! You'll be CC'd on the email so you can continue the conversation.
            </p>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--maize)', textTransform: 'uppercase' }}>
              Your Message (Optional)
            </label>
            <textarea
              className="email-draft-textarea"
              placeholder="Hey! I'd love to study together. Let me know when you're free! 😊"
              value={personalMessage}
              onChange={(e) => {
                const value = e.target.value;
                setPersonalMessage(value);
                
                // Check for inappropriate content
                const error = validateTextInput(value, 'Message');
                setMessageError(error || "");
              }}
              disabled={isSending}
            />
            {messageError && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                {messageError}
              </div>
            )}
            
            {sendStatus === 'success' && (
              <div className="status-message success">
                ✅ Email sent successfully! Check your inbox - you've been CC'd!
              </div>
            )}
            
            {sendStatus === 'error' && (
              <div className="status-message error">
                ❌ {errorMessage}
              </div>
            )}
            
            <div className="email-actions">
              <button 
                className="email-btn email-btn-primary" 
                onClick={handleSendEmail}
                disabled={isSending || !currentUser || (reachOutStatus && !reachOutStatus.can_reach_out)}
                style={{
                  opacity: (reachOutStatus && !reachOutStatus.can_reach_out) ? 0.5 : 1,
                  cursor: (reachOutStatus && !reachOutStatus.can_reach_out) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSending ? '📤 Sending...' : (reachOutStatus && !reachOutStatus.can_reach_out) ? '⚠️ Limit Reached' : '📧 Send Email'}
              </button>
              <button 
                className="email-btn email-btn-secondary" 
                onClick={closeEmailPopup}
                disabled={isSending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportDialog && (
        <div className="email-popup-overlay" onClick={handleCancelReport}>
          <div className="email-popup" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Report User</h3>
            <p style={{ color: 'var(--muted)', margin: '0 0 16px 0', fontSize: '14px' }}>
              Are you sure you want to report <strong>{user.name || 'this user'}</strong>? This action will be recorded and reviewed by our team.
            </p>
            
            {reportStatus === 'success' && (
              <div className="status-message success">
                ✅ Report submitted successfully. Thank you for helping keep Study Buddy safe.
              </div>
            )}
            
            {reportStatus === 'error' && (
              <div className="status-message error">
                ❌ Failed to submit report. Please try again.
              </div>
            )}
            
            <div className="email-actions">
              <button 
                className="email-btn email-btn-danger" 
                onClick={handleConfirmReport}
                disabled={isReporting || reportStatus === 'success'}
                style={{ 
                  background: reportStatus === 'success' ? '#28a745' : 'transparent',
                  borderColor: reportStatus === 'success' ? '#28a745' : '#dc3545',
                  color: reportStatus === 'success' ? 'white' : '#dc3545'
                }}
              >
                {isReporting ? 'Submitting...' : reportStatus === 'success' ? '✓ Reported' : 'Confirm Report'}
              </button>
              <button 
                className="email-btn email-btn-secondary" 
                onClick={handleCancelReport}
                disabled={isReporting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
