import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import "./Select.scss";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const R_Select = ({
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectProps) => {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger className={`select-trigger ${className}`}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="select-icon">
          <ChevronDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content position="item-aligned" className="select-content">
          <RadixSelect.Viewport className="select-viewport">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="select-item"
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="select-indicator">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};

export default R_Select;
