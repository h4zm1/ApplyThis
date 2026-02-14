import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    // if already logged in force go to dashboard and prevent going back (one user one session less headache for me)
    navigate("/dashboard", { replace: true });
    return null; // component must return ui or nothing
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // prevent browser from refreshing page on submit (text fields don't get wiped out)
    setError(""); // clean up errors (if there's any up)

    // make sure both passwords match
    if (password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }

    // validate password lenghth
    if (password.length < 6) {
      setError("password must be over 6 character");
      return;
    }

    setIsSubmitting(true);

    try {
      // send data to register function inside our authProvider
      await register({ email, password });
      // if successful go to dashboard page
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      setError(error.response?.data?.error || "registration failed");
    } finally {
      // whether the registration fail or succeed, we just stop loading
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>register</h1>
      {error && <div>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="form-submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account.." : "register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
