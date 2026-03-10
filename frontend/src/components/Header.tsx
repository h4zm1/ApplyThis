import { useAction } from "../context/AppContext";

const Header = () => {
  const {
    PreviewAction,
    isCompiling,
    CompileAndSaveAction,
    zoomInAction,
    zoomOutAction,
  } = useAction();

  return (
    <div className="header">
      <div className="header-content">
        <h1>HEADER</h1>
        <button onClick={PreviewAction?.run}>
          {isCompiling ? "Compiling..." : "Preview"}
        </button>
        <button onClick={CompileAndSaveAction?.run}>
          {isCompiling ? "Compiling..." : "Compile and Save"}
        </button>
        <button className="zoom-in" onClick={zoomInAction?.run}>
          +
        </button>

        <button className="zoom-out" onClick={zoomOutAction?.run}>
          -
        </button>
      </div>
    </div>
  );
};
export default Header;
