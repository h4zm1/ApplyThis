import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, Briefcase, LogOut } from "lucide-react";
import Header from "./Header";
import { useAction } from "../context/AppContext";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();
  const { headerTitle } = useAction();
  return (
    <div className="layout">
      <div className="side-bar">
        <nav className="sidebar-nav">
          {/* navlink will auto update styles when 'to' prop match current url*/}
          <NavLink
            className={({ isActive }) => `side-btn${isActive ? " active" : ""}`}
            title="dashboard"
            to="/dashboard"
            end // 'end' means exact match only
          >
            <LayoutDashboard size={21} />
            {/* Dashboard */}
          </NavLink>

          <NavLink
            className={({ isActive }) => `side-btn${isActive ? " active" : ""}`}
            to="/resumes"
            title="resumes"
          >
            <FileText size={21} />
            {/* Resumes */}
          </NavLink>

          <NavLink
            className={({ isActive }) => `side-btn${isActive ? " active" : ""}`}
            to="/jobs"
            title="jobs"
          >
            <Briefcase size={21} />
            {/* Jobs */}
          </NavLink>
        </nav>

        <div>
          {/* <div> */}
          {/* <span>{user?.email}</span> */}
          <button onClick={logout}>
            <LogOut size={17} />
          </button>
          {/* </div> */}
        </div>
        <NavLink className="logo-nav" to="/dashboard">
          applythis
        </NavLink>
      </div>
      {/* 'outlet' indicate where child routes will render */}
      <div className="main-holder">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
