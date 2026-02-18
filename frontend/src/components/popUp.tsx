import { X } from "lucide-react";
import type { ReactNode } from "react";

interface popUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const popup = ({ isOpen, onClose, title, children }: popUpProps) => {
  // don't render anything it's not open
  if (!isOpen) return null;

  return (
    <div onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <button onClick={onClose}>
          <X size={20} />
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default popup;
