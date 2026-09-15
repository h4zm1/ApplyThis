import { ToggleGroup } from "radix-ui";
import "./ToggleGroup.scss";
import { useUIContext } from "../../context/UIContext";

interface Item {
  label: string;
  value: string;
}

interface ToggleGroupProps {
  value: string;
  onChange: (value: string) => void;
  items?: Item[];
  children?: React.ReactNode;
  type?: string;
}

const R_ToggleGroup = ({
  value,
  onChange,
  items,
  children,
  type,
}: ToggleGroupProps) => {
  const { setAccentColor } = useUIContext();

  return (
    <ToggleGroup.Root
      className="toggle-group"
      value={value}
      type="single"
      onValueChange={(val) => {
        // if val is empty (deselected) and type isn't "sub", block change (bloc the deselect)
        if (!val && type !== "sub") return;

        onChange(val);

        if (val && type === "color") {
          // console.log("selected colr: ", val);
          setAccentColor(val);
        }
      }}
    >
      {/* render children if they exist, otherwise use the item array */}
      {children
        ? children
        : items?.map((item) => (
            <ToggleGroup.Item
              className="toggle-item"
              key={item.value}
              value={item.value}
            >
              {item.label}
            </ToggleGroup.Item>
          ))}
    </ToggleGroup.Root>
  );
};

export default R_ToggleGroup;
export const R_ToggleItem = ToggleGroup.Item;
