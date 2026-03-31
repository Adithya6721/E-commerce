import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [data, setData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange =
    (field: "username" | "password") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setData((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await login(data);
      navigate("/");
    } catch {
      setError("Login failed. Please check your username and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Username"
        value={data.username}
        onChange={handleChange("username")}
      />

      <input
        type="password"
        placeholder="Password"
        value={data.password}
        onChange={handleChange("password")}
      />

      {error ? <p>{error}</p> : null}

      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}
