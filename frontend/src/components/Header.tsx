import { useAction } from "../context/AppContext";

const Header = () => {
  const { PreviewAction, isCompiling, CompileAndSaveAction } = useAction();

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
      </div>
    </div>
  );
};
export default Header;
