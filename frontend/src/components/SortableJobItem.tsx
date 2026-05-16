import { PointerSensor } from "@dnd-kit/react";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { useSortable } from "@dnd-kit/react/sortable";
import { useEffect, type ReactNode } from "react";

interface Props {
  id: string;
  index: number;
  children: ReactNode;
  onDragChange: (isDragging: boolean) => void;
}

function SortableJobItem({ id, index, children, onDragChange }: Props) {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
    sensors: [
      PointerSensor.configure({
        activationConstraints: [
          new PointerActivationConstraints.Distance({ value: 10 }), // this for setting how far the mouse has to move while holding the item for the drag to get triggered, and in this case 10 pixles
        ],
      }),
    ],
  });
  useEffect(() => {
    onDragChange(isDragging);
  }, [isDragging]);
  return (
    <div ref={ref} className={`job${isDragging ? " dragging" : ""}`}>
      {/* handleRef make the entire div dragable */}
      <div ref={handleRef}>{children}</div>
    </div>
  );
}

export default SortableJobItem;

