import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logger from "../services/logger";
import PasswordField from "../components/ui/PasswordField";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // redirect if already logged in
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });

      logger.log("INSIDE LOGIN");

      // redirect to intended page (or dashboard)
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.response?.data?.error || "login failed");
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
                <Link to="/forogt">Forgot your password?</Link>
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
