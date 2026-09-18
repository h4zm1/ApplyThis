import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface popUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const popup = ({ isOpen, onClose, title, children }: popUpProps) => {
  // don't render anything it's not open
  if (!isOpen) return null;

  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h1>{title}</h1>
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
