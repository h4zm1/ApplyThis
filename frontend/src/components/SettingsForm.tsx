import { useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "./ui/ToggleGroup";
import logger from "../services/logger";

const SettingsForm = ({}) => {
  const [accent, setAccent] = useState("0");
  function test1() {}
  return (
    <div className="settings-container">
      <div className="accent">
        <h1>Accent color</h1>
        <div className="colors">
          <R_ToggleGroup value={accent} type="color" onChange={setAccent}>
            <R_ToggleItem
              className="a0"
              value="#e7e7e7"
              onClick={(e) => {
                console.log("test");
              }}
            ></R_ToggleItem>
            <R_ToggleItem
              className="a1"
              value="#ffc2c2"
              onClick={(e) => {
                console.log("test");
              }}
            ></R_ToggleItem>
            <R_ToggleItem
              className="a2"
              value="#ccffcc"
              onClick={(e) => {
                console.log("test");
              }}
            ></R_ToggleItem>
            <R_ToggleItem
              className="a4"
              value="#d3d3ff;"
              onClick={(e) => {
                console.log("test");
              }}
            ></R_ToggleItem>
            <R_ToggleItem
              className="a3"
              value="#ffffb6"
              onClick={(e) => {
                console.log("test");
              }}
            ></R_ToggleItem>
          </R_ToggleGroup>
        </div>
      </div>
    </div>
  );
};
export default SettingsForm;
