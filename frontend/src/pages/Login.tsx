import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, SetPassword] = useState("");
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

      // redirect to intended page (or dashboard)
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.response?.data?.error || "login failed");
    } finally {
      setIsSubmitting(true);
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
            <input
              type="password"
              id="password"
              value={password}
              placeholder="Password"
              onChange={(e) => {
                SetPassword(e.target.value);
              }}
              required
            />
            <div className="auth-footer">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sigining in..." : "Sign in"}
              </button>
              <p>
                <Link to="/forogt">Forgot your password?</Link>
                <Link to="/register">Create new account instead</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
