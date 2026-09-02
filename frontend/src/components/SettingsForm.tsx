import { useEffect, useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "./ui/ToggleGroup";

const SettingsForm = ({}) => {
  const [accent, setAccent] = useState("#e7e7e7");
  useEffect(() => {
    const saved = localStorage.getItem("ACCENT-COLOR");
    saved ? setAccent(saved) : setAccent("#e7e7e7");
  }, []);
  return (
    <div className="settings-container">
      <div className="accent">
        <h1>Accent color</h1>
        <div className="colors">
          <R_ToggleGroup value={accent} type="color" onChange={setAccent}>
            <R_ToggleItem className="a0" value="#e7e7e7"></R_ToggleItem>
            <R_ToggleItem className="a1" value="#ffc2c2"></R_ToggleItem>
            <R_ToggleItem className="a2" value="#ccffcc"></R_ToggleItem>
            <R_ToggleItem className="a3" value="#d3d3ff"></R_ToggleItem>
            <R_ToggleItem className="a4" value="#ffffb6"></R_ToggleItem>
          </R_ToggleGroup>
        </div>
      </div>
    </div>
  );
};
export default SettingsForm;
