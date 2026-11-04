import "./tooltip.scss";
import { useEffect, useRef, useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "bottom" | "right" | "top";
}
// i started with radix tooltip but when i found it has no visibility timer i moved to handmade version
export default function Tooltip({
  label,
  children,
  side = "bottom",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [isMouseInside, setIsMouseInside] = useState(false);

  useEffect(() => {
    // this made mainly for compiler select that keep the tooltip open after selecting item outside of "select" comp
    const handleGlobalClick = () => {
      if (timeRef.current) {
        clearTimeout(timeRef.current);
        timeRef.current = null;
      }
      setVisible(false);
      setIsMouseInside(false);
    };

    // listen for global clicks when tooltip is open or a timer is running
    if (visible || isMouseInside) {
      window.addEventListener("click", handleGlobalClick);
    }

    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, [visible, isMouseInside]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };
  const handleMouseEnter = () => {
    setIsMouseInside(true);
    timeRef.current = setTimeout(() => {
      setVisible(true);
    }, 400); // this seems to be the same as default tooltip timer
  };
  const handleMouseLeave = () => {
    setIsMouseInside(false);
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
          className={`tooltip-bubble ${side}`}
          style={
            {
              // position: "fixed",
              // left: `min(${coords.x + 12}px, calc(100vw - 20px))`,
              // left: coords.x + 12,
              // top: coords.y + 16,
            }
          }
        >
          {label}
        </span>
      )}
    </span>
  );
}
