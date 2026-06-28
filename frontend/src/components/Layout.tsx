import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, Briefcase, LogOut } from "lucide-react";
import Header from "./Header";
import { useAction } from "../context/AppContext";
import Tooltip from "./ui/tooltip";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();
  const { headerTitle } = useAction();
  const insideEditor = location.pathname.includes("editor");
  // no main content overflow in editor (make box shadow not working correctly)
  const mainContentStyle = {
    overflow: insideEditor ? "unset" : "auto",
  };

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
    </div>
  );
};

export default Layout;
