import { useState } from "react";
import PasswordStrength from "../components/PasswordStrength";
import PasswordField from "../components/ui/PasswordField";
import { resetPassword } from "../services/accountService";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  async function handleSubmit(e: React.SubmitEvent<HTMLElement>) {
    // prevent page reload on clicking the submit button
    e.preventDefault();

    setError("");
    if (confirmPassword !== password) {
      setError("passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("password must be over 6 character");
    }

    try {
      await resetPassword(token, confirmPassword);
      setIsSubmitting(true);
      navigate("/login", {
        state: { successMessage: "Password updated, you can login now" },
      });
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.error ?? "something went wrong")
          : "something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page reset">
      <h1>Reset your password</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <span>Just one more step to set a new password for your account</span>
        <PasswordField
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <PasswordStrength password={password} />

        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
        />
        <div className="auth-footer">
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            Reset your password
          </button>
          {/* this to give height to the footer without adding extra styles cause the "p" style already exist in other files */}
          <p>.</p>
        </div>
        <div className="auth-error">{error}</div>
      </form>
    </div>
  );
};
