import { useEffect, useState } from "react";
import R_ToggleGroup, { R_ToggleItem } from "../components/ui/ToggleGroup";
import PasswordStrength from "../components/PasswordStrength";
import PasswordField from "../components/ui/PasswordField";
import { Cross, X } from "lucide-react";
import { useUIContext } from "../context/UIContext";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import Popup from "../components/popUp";
import { useQuery } from "@tanstack/react-query";
import { jobsQuery, resumesQuery } from "../services/queries";
import { changePassword, deleteAccount } from "../services/accountService";
import axios from "axios";

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
  if (currentPass === newPass && newPass === confirmPass)
    errors.push("new password canot be your old password");
  if (currentPass.length < 6) enabled = false;
  return { errors, enabled, isHidden };
}

export default function Settings() {
  const [accent, setAccent] = useState("#e7e7e7");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { user, setTokens } = useAuth();
  const { setHeaderTitle } = useAction();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passError, setPassError] = useState("");
  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePass, setDeletePassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const jobsQ = useQuery({ ...jobsQuery, enabled: isPopupOpen });
  const resumesQ = useQuery({ ...resumesQuery, enabled: isPopupOpen });

  const jobsCount = jobsQ.data?.length!!;
  const resumesCount = resumesQ.data?.length!!;

  useEffect(() => {
    const saved = localStorage.getItem("ACCENT-COLOR");
    saved ? setAccent(saved) : setAccent("#e7e7e7");
    setHeaderTitle(user?.email + " > Settings");
  }, []);

  async function handleChangePass() {
    try {
      setIsChanging(true);
      const response = await changePassword(currentPassword, newPassword);
      setTokens(response.accessToken, response.refreshToken);
      setMessage("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.error ?? "could not change password")
          : "could not change password",
      );
    } finally {
      setIsChanging(false);
    }
  }

  function handleDelete() {
    setIsPopupOpen(true);
  }

  async function handleConfirmDelete() {
    try {
      await deleteAccount(deletePass);
    } catch (err) {
      setPassError(
        axios.isAxiosError(err)
          ? (err.response?.data?.error ?? "could not change password")
          : "could not change password",
      );
    }
  }

  function handleClosePopup() {
    setIsPopupOpen(false);
  }

  function plural(count: number, verb: string) {
    return count > 1
      ? count + " " + verb + "s"
      : count === 0
        ? -1
        : count + " " + verb;
  }
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
              <button
                onClick={handleChangePass}
                disabled={!enabled && !isChanging}
              >
                {isChanging ? "Updating..." : "Change password"}
              </button>
            </div>
          ) : (
            ""
          )}
          {message ? (
            <div className="pw-footer">
              <span className="pass-msg">{message}</span>
            </div>
          ) : (
            ""
          )}
          {error ? (
            <div className="pw-footer">
              <span className="pass-error">{error}</span>
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
          <button onClick={handleDelete}>Delete account</button>
        </div>
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title={"Delete account"}
      >
        <div className="delete-popup-content">
          <p>
            This will <span style={{ fontWeight: "500" }}>permanently</span>{" "}
            delete your account, together with the following resources linked to
            it:
          </p>
          <ul>
            {resumesCount > 0 ? (
              <li>{plural(resumesCount, "resume")} and all their files</li>
            ) : (
              ""
            )}
            {jobsCount > 0 ? (
              <li>Tracking of {plural(jobsCount, "job")}</li>
            ) : (
              ""
            )}
          </ul>
          <div className="warning-holder">
            <span className="red-warning">This action cannot be undone.</span>
            <span className="black-warning">
              To confirm, type your password:
            </span>
          </div>
          <div className="pw-input-fields">
            <input
              type="password"
              value={deletePass}
              onChange={(e) => setDeletePassword(e.target.value)}
            ></input>
            {passError ? <span className="pass-error">{passError}</span> : ""}
          </div>
          <div className="button-holder">
            <button onClick={() => setIsPopupOpen(false)}>Cancel</button>
            <button disabled={deletingAccount}>Delete account</button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
