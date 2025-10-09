import { useNavigate } from "react-router-dom";

export default function ProfileButton() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    // For now, we'll navigate to a profile route
    // Later we can implement a modal or dedicated profile page
    navigate("/profile");
  };

  return (
    <>
      <style>{`
        .profile-button {
          position: fixed;
          top: 20px;
          left: 20px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.3);
          background: transparent;
          color: var(--fg);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .profile-button:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .profile-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--maize), #ff6b35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          color: #111;
        }
      `}</style>
      
      <button className="profile-button" onClick={handleProfileClick}>
        <div className="profile-icon">👤</div>
        Profile
      </button>
    </>
  );
}
