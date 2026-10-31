import { ChevronRight, Cloud, CloudBackup, CloudOff } from "lucide-react";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { syncStatus, headerTitle } = useAction();
  const { user } = useAuth();

  let [t1, t2] = (headerTitle ?? "").split(" > ", 2);
  if (user?.isDemo) t1 = "DEMO USER";

  return (
    <div className="header">
      <div className="header-content">
        {t2 === "editor" ? (
          <div>
            <div className="sync-icon">
              {syncStatus === -1 ? (
                <CloudBackup size={15} />
              ) : syncStatus === 1 ? (
                <Cloud size={15} />
              ) : (
                <CloudOff size={15} />
              )}
            </div>
            <span>{t1}</span>
          </div>
        ) : (
          <div>
            {user?.isDemo ? (
              <span className="t1">{t1}</span>
            ) : (
              <span>{t1}</span>
            )}
            {t2 && <ChevronRight size={15}></ChevronRight>}
            <span>{t2}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default Header;
