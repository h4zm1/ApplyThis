import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  LogOut,
  Settings,
} from "lucide-react";
import Header from "./Header";
import { useAction } from "../context/AppContext";
import Tooltip from "./ui/tooltip";
import { useState } from "react";
import logger from "../services/logger";
import Popup from "../components/popUp";
import SettingsForm from "./SettingsForm";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();
  const { headerTitle } = useAction();
  const insideEditor = location.pathname.includes("editor");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // no main content overflow in editor (make box shadow not working correctly)
  const mainContentStyle = {
    overflow: insideEditor ? "unset" : "auto",
  };

  function openSettings() {
    setIsPopupOpen(true);
    logger.log("open setttings");
  }
  function handleClosePopup() {
    setIsPopupOpen(false);
  }

  return (
    <div className="layout">
      <div className="side-bar">
        <nav className="sidebar-nav">
          {/* navlink will auto update styles when 'to' prop match current url*/}
          <Tooltip label="dashboard" side="right">
            <NavLink
              className={({ isActive }) =>
                `side-btn${isActive ? " active" : ""}`
              }
              to="/dashboard"
              end // 'end' means exact match only
            >
              <LayoutDashboard size={21} />
              {/* Dashboard */}
            </NavLink>
          </Tooltip>

          <Tooltip label="resumes" side="right">
            <NavLink
              className={({ isActive }) =>
                `side-btn${isActive ? " active" : ""}`
              }
              to="/resumes"
            >
              <FileText size={21} />
              {/* Resumes */}
            </NavLink>
          </Tooltip>

          <Tooltip label="jobs" side="right">
            <NavLink
              className={({ isActive }) =>
                `side-btn${isActive ? " active" : ""}`
              }
              to="/jobs"
            >
              <Briefcase size={21} />
              {/* Jobs */}
            </NavLink>
          </Tooltip>
        </nav>

        <div className="logout-holder">
          <Tooltip label="settings" side="right">
            <button onClick={openSettings}>
              <Settings size={21} />
            </button>
          </Tooltip>
          <Tooltip label="logout" side="right">
            <button onClick={logout}>
              <LogOut size={21} />
            </button>
          </Tooltip>
        </div>
        <NavLink className="logo-nav" to="/dashboard">
          applythis
        </NavLink>
      </div>
      {/* 'outlet' indicate where child routes will render */}
      <div className="main-holder">
        <Header />
        <main className="main-content" style={mainContentStyle}>
          <Outlet />
        </main>
      </div>
      <Popup isOpen={isPopupOpen} onClose={handleClosePopup} title={"Settings"}>
        <SettingsForm></SettingsForm>
      </Popup>
    </div>
  );
};

export default Layout;
