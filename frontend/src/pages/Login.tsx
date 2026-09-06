import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logger from "../services/logger";
import PasswordField from "../components/ui/PasswordField";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  // redirect if already logged in
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
    return null;
  }

  useEffect(() => {
    // check if we came from register page with successfull registration
    if (location.state?.successMessage) {
      setMessage(location.state.successMessage);
      setMessageType("success");

      // this to clear the reg success message on login page refresh (otherwise it won't)
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // this's the query params from the verify endpoint redirect
    if (searchParams.get("verified") === "true") {
      setMessage("Email verified, you can now log in.");
      setMessageType("success");
    } else if (searchParams.get("error") === "token_expired") {
      setMessage("Verification link expired. Please register again.");
      setMessageType("error");
    } else if (searchParams.get("error") === "invalid_token") {
      setMessage("Invalid verification link.");
      setMessageType("error");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await login({ email, password });

      logger.log("INSIDE LOGIN");

      // redirect to intended page (or dashboard)
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error === "email not verified")
          setError(
            "Please verify your email before logging in. Check your inbox.",
          );
        else setError(error.response?.data?.error || "login failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="outer-shell">
      <div className="side-bar">
        <div className="logo-nav">applythis</div>
      </div>
      <div className="inner-shell">
        <div className="auth-page">
          <h1>Sign In</h1>
          <div className="verify-message">{message && <p>{message}</p>}</div>
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // two way binding
              required
            />
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />

            <div className="auth-footer">
              <button type="submit" disabled={isSubmitting}>
                Sign in
                {/* {isSubmitting ? "Sigining in..." : "Sign in"} */}
              </button>
              <p>
                <Link to="/forgot">Forgot your password?</Link>
                <Link to="/register">Create new account instead</Link>
              </p>
            </div>
            <div className="auth-error">{error}</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
