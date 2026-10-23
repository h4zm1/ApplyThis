import { Outlet } from "react-router-dom";

const OuterShell = () => {
  return (
    <div className="outer-shell">
      <div className="side-bar">
        <div className="logo-nav">applythis</div>
      </div>
      <div className="inner-shell">
        <Outlet />
      </div>
    </div>
  );
};
export default OuterShell;
