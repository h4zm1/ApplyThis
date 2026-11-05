import { BrushCleaning, X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Tooltip from "./ui/tooltip";

interface popUpProps {
  isOpen: boolean;
  onClose: () => void;
  clearErrors?: () => void;
  title: string;
  children: ReactNode;
}

const popup = ({
  isOpen,
  onClose,
  clearErrors,
  title,
  children,
}: popUpProps) => {
  // don't render anything it's not open
  if (!isOpen) return null;

  return createPortal(
    <div className="popup-overlay" onMouseDown={onClose}>
      <div className="popup-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h1>{title}</h1>
          {title === "Errors" ? (
            <Tooltip label="Clear errors" side="bottom">
              <button className="clear-error-btn" onClick={clearErrors}>
                <BrushCleaning size={18}></BrushCleaning>
              </button>
            </Tooltip>
          ) : (
            ""
          )}
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default popup;
