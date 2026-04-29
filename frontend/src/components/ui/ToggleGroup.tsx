import { ToggleGroup } from "radix-ui";
import "./ToggleGroup.scss";

interface Item {
  label: string;
  value: string;
}

interface ToggleGroupProps {
  value: string;
  onChange: (value: string) => void;
  items: Item[];
}

const R_ToggleGroup = ({ value, onChange, items }: ToggleGroupProps) => (
  <ToggleGroup.Root
    className="toggle-grounp"
    value={value}
    type="single"
    onValueChange={(val) => {
      if (val) onChange(val);
    }}
  >
    {items.map((item) => (
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

export default R_ToggleGroup;
