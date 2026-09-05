import { unstable_PasswordToggleField as PasswordToggleField } from "radix-ui";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import "./PasswordField.scss";
import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // catch the hide/show button
      const button = containerRef.current.querySelector(".Toggle");
      if (button) {
        // force tabindex -1 so we can tab from password to confirm password fields without going through the eye button
        button.setAttribute("tabindex", "-1");
      }
    }
  }, []);
  return (
    <PasswordToggleField.Root>
      <div className="Root" ref={containerRef}>
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
