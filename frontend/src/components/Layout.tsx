import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, Briefcase, LogOut } from "lucide-react";

// main layout wrapper
const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <NavLink to="/dashboard">ApplyThis</NavLink>

      <nav>
        {/* navlink will auto update styles when 'to' prop match current url*/}
        <NavLink
          to="/dashboard"
          end // 'end' means exact match only
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/resumes">
          <FileText size={20} />
          Resumes
        </NavLink>

        <NavLink to="/jobs">
          <Briefcase size={20} />
          Jobs
        </NavLink>
      </nav>

      <div>
        <div>
          <span>{user?.email}</span>
          <button onClick={logout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* 'outlet' indicate where child routes will render */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
