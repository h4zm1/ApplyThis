import { useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "./ui/ToggleGroup";

const SettingsForm = ({}) => {
  const [accent, setAccent] = useState("0");
  return (
    <div className="settings-container">
      <div className="accent">
        <h1>Accent color</h1>
        <div className="colors">
          <R_ToggleGroup value={accent} onChange={setAccent}>
            <R_ToggleItem className="a0" value="green"></R_ToggleItem>
            <R_ToggleItem className="a1" value="red"></R_ToggleItem>
            <R_ToggleItem className="a2" value="blue"></R_ToggleItem>
            <R_ToggleItem className="a3" value="yellow"></R_ToggleItem>
          </R_ToggleGroup>
        </div>
      </div>
    </div>
  );
};
export default SettingsForm;
