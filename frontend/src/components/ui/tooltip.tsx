import "./tooltip.scss";
import { useRef, useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "bottom" | "right";
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

  const handleMouseMove = (e: React.MouseEvent) => {
    // hid and trigger tooltip whenever mouse move
    handleMouseLeave();
    handleMouseEnter();
    setCoords({ x: e.clientX, y: e.clientY });
    // move the tooltip bit to the left when on the right helf of the screen to fix the clipping issue
    // const onRightSide = e.clientX > window.innerWidth / 2;
    //
    // setCoords({
    //   x: onRightSide ? e.clientX - 120 : e.clientX + 62,
    //   y: e.clientY + 16,
    // });
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
