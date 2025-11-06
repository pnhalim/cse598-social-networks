import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();

  const isActive = (path) => {
    if (path === "/home" || path === "/") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/", { replace: true });
  };

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
        }
        * { box-sizing: border-box; }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: ${isOpen ? '260px' : '70px'};
          background: rgba(0, 0, 0, 0.5);
          border-right: 1px solid rgba(255,255,255,.1);
          backdrop-filter: blur(10px);
          padding: ${isOpen ? '24px 16px' : '16px 8px'};
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
          transition: width 0.3s ease, padding 0.3s ease, transform 0.3s ease;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: ${isOpen ? '12px' : '0'};
          margin-bottom: ${isOpen ? '32px' : '24px'};
          padding-bottom: ${isOpen ? '24px' : '0'};
          border-bottom: ${isOpen ? '1px solid rgba(255,255,255,.1)' : 'none'};
          transition: all 0.3s ease;
        }

        .menu-button {
          width: ${isOpen ? 'auto' : '100%'};
          height: auto;
          min-height: 44px;
          padding: ${isOpen ? '12px' : '12px'};
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          color: var(--fg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 20px;
          font-family: var(--font);
          flex-shrink: 0;
        }

        .menu-button:hover {
          background: rgba(255,255,255,.1);
          border-color: var(--maize);
        }

        .sidebar-brand {
          font-size: 24px;
          font-weight: 900;
          color: var(--maize);
          margin: 0;
          text-shadow: 0 2px 10px rgba(255, 205, 0, 0.3);
          font-family: var(--font);
          white-space: nowrap;
          opacity: ${isOpen ? '1' : '0'};
          width: ${isOpen ? 'auto' : '0'};
          overflow: hidden;
          transition: opacity 0.3s ease, width 0.3s ease;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: ${isOpen ? '12px' : '0'};
          padding: ${isOpen ? '12px 16px' : '12px'};
          border-radius: 8px;
          color: var(--fg);
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          text-align: ${isOpen ? 'left' : 'center'};
          justify-content: ${isOpen ? 'flex-start' : 'center'};
          font-family: var(--font);
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255,255,255,.08);
          border-color: rgba(255,205,0,.2);
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(255,205,0,.15), rgba(255,107,53,.1));
          border-color: var(--maize);
          color: var(--maize);
        }

        .nav-icon {
          font-size: 20px;
          width: ${isOpen ? '24px' : '100%'};
          text-align: center;
          flex-shrink: 0;
        }

        .nav-item span:not(.nav-icon) {
          opacity: ${isOpen ? '1' : '0'};
          width: ${isOpen ? 'auto' : '0'};
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.3s ease, width 0.3s ease;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,.1);
          overflow: hidden;
        }

        .logout-btn {
          width: 100%;
          padding: ${isOpen ? '12px 16px' : '12px'};
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(255,255,255,.05);
          color: var(--fg);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font);
          display: flex;
          align-items: center;
          justify-content: ${isOpen ? 'flex-start' : 'center'};
          gap: ${isOpen ? '8px' : '0'};
        }

        .logout-icon {
          font-size: 20px;
          flex-shrink: 0;
          opacity: ${isOpen ? '0' : '1'};
          width: ${isOpen ? '0' : 'auto'};
          overflow: hidden;
          transition: opacity 0.3s ease, width 0.3s ease;
          display: block;
        }

        .logout-btn span:not(.logout-icon) {
          opacity: ${isOpen ? '1' : '0'};
          width: ${isOpen ? 'auto' : '0'};
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.3s ease, width 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 0, 0, 0.1);
          border-color: rgba(255, 0, 0, 0.3);
          color: #ff6b6b;
        }

        .mobile-menu-button {
          display: none;
        }

        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 260px;
            padding: 20px 12px;
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'};
            z-index: 1000;
          }

          .sidebar-backdrop {
            display: ${isOpen ? 'block' : 'none'};
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
          }

          .mobile-menu-button {
            display: flex;
            position: fixed;
            top: 16px;
            left: 16px;
            width: 44px;
            height: 44px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,.2);
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            color: var(--fg);
            cursor: pointer;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            z-index: 998;
            transition: all 0.3s ease;
            font-family: var(--font);
          }

          .mobile-menu-button:hover {
            background: rgba(255,255,255,.1);
            border-color: var(--maize);
          }

          .mobile-menu-button.hidden {
            display: none;
          }
        }
      `}</style>

      <div className={`mobile-menu-button ${isOpen ? 'hidden' : ''}`} onClick={toggleSidebar} aria-label="Open sidebar">
        ☰
      </div>
      {isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}
      <div className="sidebar">
          <div className="sidebar-header">
            <button className="menu-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {isOpen ? '✕' : '☰'}
            </button>
            <h1 className="sidebar-brand">Study Buddy</h1>
          </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isActive("/home") ? "active" : ""}`}
            onClick={() => {
              navigate("/home");
              if (window.innerWidth <= 768) toggleSidebar();
            }}
            title={!isOpen ? "Find Study Buddies" : ""}
          >
            <span className="nav-icon">🔍</span>
            <span>Find Study Buddies</span>
          </button>

          <button
            className={`nav-item ${isActive("/connections") ? "active" : ""}`}
            onClick={() => {
              navigate("/connections");
              if (window.innerWidth <= 768) toggleSidebar();
            }}
            title={!isOpen ? "My Connections" : ""}
          >
            <span className="nav-icon">👥</span>
            <span>My Connections</span>
          </button>

          <button
            className={`nav-item ${isActive("/profile") ? "active" : ""}`}
            onClick={() => {
              navigate("/profile");
              if (window.innerWidth <= 768) toggleSidebar();
            }}
            title={!isOpen ? "My Profile" : ""}
          >
            <span className="nav-icon">👤</span>
            <span>My Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title={!isOpen ? "Log Out" : ""}
          >
            <span className="logout-icon">⇱</span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

