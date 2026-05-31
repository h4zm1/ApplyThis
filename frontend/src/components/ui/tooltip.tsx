import "./tooltip.scss";
import { useRef, useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}
// i started with radix tooltip but when i found it has no visibility timer i moved to handmade version
export default function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    // hid and trigger tooltip whenever mouse move
    handleMouseLeave();
    handleMouseEnter();
    setCoords({ x: e.clientX, y: e.clientY });
  };
  const handleMouseEnter = () => {
    timeRef.current = setTimeout(() => {
      setVisible(true);
    }, 700); // this seems to be the same as default tooltip timer
  };
  const handleMouseLeave = () => {
    if (timeRef.current) {
      clearTimeout(timeRef.current);
      timeRef.current = null;
    }
    setVisible(false);
  };
  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <span
          className="tooltip-bubble"
          style={{
            // position: "fixed",
            left: coords.x + 12,
            top: coords.y + 16,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
