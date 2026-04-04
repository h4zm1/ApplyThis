import { PointerSensor } from "@dnd-kit/react";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { useSortable } from "@dnd-kit/react/sortable";
import type { ReactNode } from "react";

interface Props {
  id: string;
  index: number;
  children: ReactNode;
}

function SortableResumeItem({ id, index, children }: Props) {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
    sensors: [
      PointerSensor.configure({
        activationConstraints: [
          new PointerActivationConstraints.Distance({ value: 10 }),
        ],
      }),
    ],
  });

  return (
    <div
      ref={ref}
      className="resume"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* handleRef make the entire div dragable */}
      <div ref={handleRef} style={{ cursor: "grab" }}>
        {children}
      </div>
    </div>
  );
}

export default SortableResumeItem;
