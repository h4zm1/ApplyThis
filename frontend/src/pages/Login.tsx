import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    <div>
      <h1>login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // two way binding
            required
          />
        </div>
        <div>
          <label>password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              SetPassword(e.target.value);
            }}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
