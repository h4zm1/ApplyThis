import {
  ChevronLeft,
  ChevronRight,
  CloudAlert,
  CloudBackup,
  CloudCheck,
  CloudOff,
} from "lucide-react";
import { useAction } from "../context/AppContext";

const Header = () => {
  const {
    PreviewAction,
    isCompiling,
    CompileAndSaveAction,
    zoomInAction,
    zoomOutAction,
    syncStatus,
    headerTitle,
  } = useAction();
  const [t1, t2] = (headerTitle ?? "").split(" > ", 2);

  return (
    <div className="header">
      <div className="header-content">
        <div>
          {t2 === "editor" ? (
            <div>
              <div className="sync-icon">
                {syncStatus === -1 ? (
                  <CloudBackup size={20} />
                ) : syncStatus === 1 ? (
                  <CloudCheck size={20} />
                ) : (
                  <CloudOff size={20} />
                )}
              </div>
              <span>{t1}</span>
            </div>
          ) : (
            <div>
              <span>{t1}</span>
              {t2 && <ChevronRight size={15}></ChevronRight>}
              <span>{t2}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Header;
