import zxcvbn from "zxcvbn";
import "../styles/_passwordStrength.scss";

interface PasswordStrengthProps {
  password: string;
}

// zxcvbn return sscores 0-4
const STRENGTH = [
  { label: "Very weak", color: "#dc2626" },
  { label: "Weak", color: "#f97316" },
  { label: "Fair", color: "#eab308" },
  { label: "Strong", color: "#22c55e" },
  { label: "Very strong", color: "#16a34a" },
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const result = zxcvbn(password);
  const { label, color } = STRENGTH[result.score];

  return (
    <div className="strength-bar">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={"bar-segment" + i}
          style={{
            height: "2px",
            flex: "1",
            transition: "background-color 0.3s ease",

            backgroundColor: i <= result.score ? color : "transparent",
          }}
        />
      ))}
    </div>
  );
}
