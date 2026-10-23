import { useState } from "react";
import { forgotPassword } from "../services/accountService";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
    } catch (error) {
      setError(
        axios.isAxiosError(error)
          ? (error?.response?.data.eror ?? "something went wrong")
          : "something went wrong",
      );
    }
  }

  return (
    <div className="auth-page forgot">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Forgot your password?</h1>
        <span>
          Enter your email address below, You will recieve an email with a link
          <br />
          that allows you to set a new password
        </span>
        <input
          type="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // two way binding
          required
        />

        <div className="auth-footer">
          <button type="submit">Send password reset email</button>
          <p>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create a new account</Link>
          </p>
        </div>
        <div className="auth-error">{error}</div>
      </form>
    </div>
  );
}
