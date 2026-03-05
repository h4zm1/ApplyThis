import { useAction } from "../context/AppContext";

const Header = () => {
  const { PreviewAction, isCompiling } = useAction();

  return (
    <div className="header">
      <div className="header-content">
        <h1>HEADER</h1>
        <button onClick={PreviewAction?.run}>
          {isCompiling ? "Compiling..." : "Run"}
        </button>
      </div>
    </div>
  );
};
export default Header;
