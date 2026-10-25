import { useEffect, useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "../components/ui/ToggleGroup";
import PasswordStrength from "../components/PasswordStrength";
import PasswordField from "../components/ui/PasswordField";
import { Cross, X } from "lucide-react";

function validatePassword(
  newPass: string,
  confirmPass: string,
  currentPass: string,
) {
  const errors = [];
  let enabled = false;
  let isHidden = true;

  if (currentPass || newPass || confirmPass) {
    isHidden = false;
  } else {
    isHidden = true;
  }

  if (newPass === confirmPass) {
    if (newPass !== "") {
      if (newPass.length < 6) {
        errors.push("password must be over 6 characters");
        enabled = false;
      } else {
        enabled = true;
      }
    } else {
      enabled = false;
    }
  } else {
    enabled = false;
    errors.push("passwords do not match");

    if (newPass.length < 6 && newPass !== "") {
      errors.push("password must be over 6 characters");
    } else {
    }
  }
  return { errors, enabled, isHidden };
}

export default function Settings() {
  const [accent, setAccent] = useState("#e7e7e7");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ACCENT-COLOR");
    saved ? setAccent(saved) : setAccent("#e7e7e7");
  }, []);
  const { errors, enabled, isHidden } = validatePassword(
    newPassword,
    confirmPassword,
    currentPassword,
  );
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
            {/* <PasswordStrength password={newPassword} /> */}

            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          {!isHidden ? (
            <div className="pw-footer">
              {errors.map((er, index) => (
                <span>
                  <X size={10} strokeWidth={3} /> {er}
                </span>
              ))}
              <button disabled={!enabled}> Change password</button>
            </div>
          ) : (
            ""
          )}
        </div>
        <h1>Delete Account</h1>
        <div className="delete-content">
          <h1>Permanently delete this account.</h1>
          <span>
            This will delete all resumes, jobs and files that you created and
            own.
          </span>
          <button>Delete account</button>
        </div>
      </div>
    </div>
  );
}
