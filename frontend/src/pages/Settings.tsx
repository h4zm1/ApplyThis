import { useEffect, useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "../components/ui/ToggleGroup";
import PasswordStrength from "../components/PasswordStrength";
import PasswordField from "../components/ui/PasswordField";

export default function Settings() {
  const [accent, setAccent] = useState("#e7e7e7");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isHidden, setIsHidden] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ACCENT-COLOR");
    saved ? setAccent(saved) : setAccent("#e7e7e7");
  }, []);
  function addError(er: string) {
    if (error.includes(er)) {
      return;
    } else {
      setError([...error, er]);
    }
  }
  function removeError(er: string) {
    setError(error.filter((er) => er.includes(er)));
  }

  useEffect(() => {
    // if any of the field contain any text => show button
    if (currentPassword || newPassword || confirmPassword) {
      setIsHidden(false);
    } else {
      setIsHidden(true);
    }
    if (newPassword === confirmPassword) {
      removeError("do not match");
      if (newPassword !== "") {
        if (newPassword.length < 6) {
          addError("password must be over 6 characters");
          setIsEnabled(false);
        } else {
          setIsEnabled(true);
          removeError("must be over");
        }
      } else {
        // setIsEnabled(false);
        // addError("passwords do not match");
      }
    } else {
      setIsEnabled(false);
      addError("passwords do not match");
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <div className="settings">
      <div className="page-title">
        <span>Settings</span>
        {/* <p>Track job applications</p> */}
      </div>
      <div className="settings-grid">
        <h1>Accent color</h1>
        <div className="accent">
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
        <h1>Password</h1>
        <div className="password-sec">
          <div className="pw-input-fields">
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />

            <PasswordField
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <PasswordStrength password={newPassword} />

            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          {!isHidden ? (
            <div>
              <button disabled={!isEnabled}> Change password</button>
              {error.map((er, index) => (
                <span>{er}</span>
              ))}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
