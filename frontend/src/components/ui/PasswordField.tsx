import { unstable_PasswordToggleField as PasswordToggleField } from "radix-ui";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import "./PasswordField.scss";

interface passwordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required: boolean;
}
export default function PasswordField({
  value,
  onChange,
  placeholder,
  required,
}: passwordFieldProps) {
  return (
    <PasswordToggleField.Root>
      <div className="Root">
        <PasswordToggleField.Input
          className="Input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        <PasswordToggleField.Toggle className="Toggle">
          <PasswordToggleField.Icon
            visible={<EyeOpenIcon />}
            hidden={<EyeClosedIcon />}
          />
        </PasswordToggleField.Toggle>
      </div>
    </PasswordToggleField.Root>
  );
}
