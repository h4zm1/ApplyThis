import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, Briefcase, LogOut } from "lucide-react";
import Header from "./Header";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <div className="side-bar">
        <nav className="sidebar-nav">
          {/* navlink will auto update styles when 'to' prop match current url*/}
          <NavLink
            title="dashboard"
            to="/dashboard"
            end // 'end' means exact match only
          >
            <LayoutDashboard size={21} />
            {/* Dashboard */}
          </NavLink>

          <NavLink to="/resumes" title="resumes">
            <FileText size={21} />
            {/* Resumes */}
          </NavLink>

          <NavLink to="/jobs" title="jobs">
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
          ApplyThis
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
