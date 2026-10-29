import { Link, Outlet } from "react-router-dom";

const OuterShell = () => {
  return (
    <div className="outer-shell">
      <div className="side-bar">
        <Link to="/login">
          <div className="logo-nav">applythis</div>
        </Link>
      </div>
      <div className="inner-shell">
        <Outlet />
      </div>
    </div>
  );
};
export default OuterShell;
