import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    // if (!code) {
    //   // no code in url, just redirect to login
    //   navigate("/login?error=invalid_token", { replace: true });
    //   return;
    // }

    async function exchangeCode() {
      try {
        // exchange code for jwt tokens
        const response = await api.post("/auth/exchange-code", { code });
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // skip login (auto login)
        navigate("/dashboard", { replace: true });
      } catch (err: any) {
        const message = err.response?.data?.error || "verification failed";

        if (message === "code expired") {
          // code expired, redirect to login for manual login
          navigate("/login?error=code_expired", { replace: true });
        } else {
          setError(message);
        }
      }
    }

    exchangeCode();
  }, []);

  return (
    <div>
      <div>
        <p>Verifying your email...</p>
      </div>
    </div>
  );
}
