import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import "./Select.scss";
type statusOption = { label: string; value: string };
type resumeOption = { name: string; id: string };
interface Option {
  options: (statusOption | resumeOption)[];
}

const getOptionData = (opt: statusOption | resumeOption) => {
  if ("id" in opt) return { value: opt.id, label: opt.name };
  else return { value: opt.value, label: opt.label };
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (statusOption | resumeOption)[];
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
            {options.map((opt) => {
              const { value, label } = getOptionData(opt);
              return (
                <RadixSelect.Item
                  key={value}
                  value={value}
                  className="select-item"
                >
                  <RadixSelect.ItemText>{label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="select-indicator">
                    <CheckIcon />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              );
            })}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};

export default R_Select;
