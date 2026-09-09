import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrength from "../components/PasswordStrength";
import { unstable_PasswordToggleField as PasswordToggleField } from "radix-ui";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { EyeClosedIcon } from "lucide-react";
import PasswordField from "../components/ui/PasswordField";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);

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
      await register({ email, password });
      setIsRegistered(true);

      // if successful go to login page with success message
      // navigate("/login", {
      //   replace: true,
      //   state: {
      //     successMessage: "Registration successful! Check your email.",
      //     email,
      //     password,
      //   },
      // });
    } catch (error: any) {
      setError(error.response?.data?.error || "registration failed");
      console.log("registration failed", error);
    } finally {
      // whether the registration fail or succeed, we just stop loading
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
          {!isRegistered ? (
            <div>
              <h1>Sign Up</h1>

              <form className="auth-form" onSubmit={handleSubmit}>
                {/* {error && <div className="auth-error">{error}</div>} */}

                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />

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
                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Siging up..." : "Sign up"}
                  </button>
                  <p>
                    Already have an account? <Link to="/login">Log in</Link>
                  </p>
                </div>
                <div className="auth-error">{error}</div>
              </form>
            </div>
          ) : (
            <div className="reg-message">
              <h1>REQUEST RECEIVED</h1>
              <div className="reg-content">
                <p> THANK YOU FOR SUBMITTING YOUR EMAIL ADDRESS. </p>
                <p>
                  IF YOUR EMAIL HAS BEEN RECOGNIZED, YOU WILL RECEIVE AN EMAIL
                  <br />
                  WITH THE INFORMATION NEEDED TO ACTIVATE YOUR ACCOUNT.
                </p>

                <p>
                  THE EMAIL MIGHT TAKE A COUPLE OF MINUTES TO REACH YOUR <br />
                  ACCOUNT. PLEASE CHECK YOUR JUNK MAIL TO ENSURE <br />
                  YOU RECEIVE IT.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
