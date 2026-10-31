import { ToggleGroup } from "radix-ui";
import "./ToggleGroup.scss";
import { useUIContext } from "../../context/UIContext";

interface Item {
  label: string;
  value: string;
  disabled?: boolean;
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
  const { setAccentColor, minSub, minPrime } = useUIContext();

  return (
    <ToggleGroup.Root
      className="toggle-group"
      value={value}
      type="single"
      onValueChange={(val) => {
        // if val is empty (deselected) and type isn't "sub", block change (bloc the deselect)
        if (!val && type !== "sub") return;
        if (val === "") return; // prevent deselection
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
        : items?.map((item, index) => {
            const isBehindCurrentPrimeStatus: boolean =
              type === "prime" && index < minPrime;

            const isBehindCurrentSubStatus: boolean =
              type === "sub" && index < minSub;
            return (
              <ToggleGroup.Item
                className="toggle-item"
                key={item.value}
                value={item.value}
                // lock button if it's behind current status
                disabled={
                  item.disabled ||
                  isBehindCurrentSubStatus ||
                  isBehindCurrentPrimeStatus
                }
              >
                {item.label}{" "}
              </ToggleGroup.Item>
            );
          })}
    </ToggleGroup.Root>
  );
};

export default R_ToggleGroup;
export const R_ToggleItem = ToggleGroup.Item;
