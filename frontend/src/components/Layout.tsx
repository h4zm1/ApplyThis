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
import { useEffect, useState } from "react";
import logger from "../services/logger";
import Popup from "../components/popUp";
import SettingsForm from "./SettingsForm";
import { useUIContext } from "../context/UIContext";
import { getStaleJobsCount } from "../services/jobService";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();
  const { staleCount, setStaleCount } = useUIContext();
  const { headerTitle } = useAction();
  const insideEditor = location.pathname.includes("editor");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { accentColor, setAccentColor } = useUIContext();
  const [tabColor, setTabColor] = useState("");
  const [tabHoverColor, setTabHoverColor] = useState("");
  // const [staleCount, setStaleCount] = useState("0");
  function openSettings() {
    setIsPopupOpen(true);
  }
  function handleClosePopup() {
    setIsPopupOpen(false);
  }
  async function getStateCount() {
    const count = await getStaleJobsCount();
    setStaleCount(count);
  }
  useEffect(() => {
    const saved = localStorage.getItem("ACCENT-COLOR");
    if (saved) setAccentColor(saved);
    else setAccentColor("#e7e7e7");
    getStateCount();
  }, []);

  useEffect(() => {
    if (accentColor) {
      const bgColor = `color-mix(in srgb, ${accentColor} 20%, transparent`;
      setTabColor(`color-mix(in srgb, ${accentColor} 100%, transparent`);
      setTabHoverColor(`color-mix(in srgb, ${accentColor} 60%, transparent`);
      document.body.style.setProperty("--body-bg", bgColor);
      localStorage.setItem("ACCENT-COLOR", accentColor);
    } else {
      document.body.style.removeProperty("--body-btn-bg");
    }
  }, [accentColor]);

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
              style={
                {
                  "--active-btn-bg": tabColor,
                  "--hover-btn-bg": tabHoverColor,
                } as React.CSSProperties
              }
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
              style={
                {
                  "--active-btn-bg": tabColor,
                  "--hover-btn-bg": tabHoverColor,
                } as React.CSSProperties
              }
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
              style={
                {
                  "--active-btn-bg": tabColor,
                  "--hover-btn-bg": tabHoverColor,
                } as React.CSSProperties
              }
            >
              <Briefcase size={21} />
              {staleCount > 0 ? (
                <div className="stale-jobs-notif">
                  <span>{staleCount}</span>
                </div>
              ) : (
                <div></div>
              )}
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
        <NavLink
          className={`logo-nav ${user ? "inside" : "outside"}`}
          to="/dashboard"
        >
          applythis
        </NavLink>
      </div>
      {/* 'outlet' indicate where child routes will render */}
      <div className="main-holder">
        <Header />
        {/* no main content overflow in editor (make box shadow not working correctly) */}
        <main
          className="main-content"
          style={{ overflow: insideEditor ? "unset" : "auto" }}
        >
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
