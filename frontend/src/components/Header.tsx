import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAction } from "../context/AppContext";

const Header = () => {
  const {
    PreviewAction,
    isCompiling,
    CompileAndSaveAction,
    zoomInAction,
    zoomOutAction,
    headerTitle,
  } = useAction();
  const [t1, t2] = (headerTitle ?? "").split(" > ", 2);
  return (
    <div className="header">
      <div className="header-content">
        {/* <h1>HEADER</h1> */}
        {/* <button onClick={PreviewAction?.run}> */}
        {/*   {isCompiling ? "Compiling..." : "Preview"} */}
        {/* </button> */}
        {/* <button onClick={CompileAndSaveAction?.run}> */}
        {/*   {isCompiling ? "Compiling..." : "Compile and Save"} */}
        {/* </button> */}
        {/* <button className="zoom-in" onClick={zoomInAction?.run}> */}
        {/*   + */}
        {/* </button> */}
        {/**/}
        {/* <button className="zoom-out" onClick={zoomOutAction?.run}> */}
        {/*   - */}
        {/* </button> */}
        <div>
          <span>{t1}</span>
          <ChevronRight size={15}></ChevronRight>
          <span>{t2}</span>
        </div>
      </div>
    </div>
  );
};
export default Header;
