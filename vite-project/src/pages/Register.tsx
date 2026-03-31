import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [data, setData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await register(data);
    navigate("/login");
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        placeholder="Username"
        onChange={(e) => setData({ ...data, username: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setData({ ...data, password: e.target.value })}
      />
      <button onClick={handleSubmit}>Register</button>
    </div>
  );
}