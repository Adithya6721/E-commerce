import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {
  const [data, setData] = useState({ username: "", password: "" });
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!data.username.trim() || !data.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        username: data.username,
        password: data.password,
        role: isSeller ? "SELLER" : "CUSTOMER",
      });
      navigate("/login");
    } catch {
      setError("Registration failed. Username might already be taken.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7">
          <h1 className="text-3xl font-bold text-white">Create Account 🚀</h1>
          <p className="mt-1 text-sm text-indigo-200">Join our marketplace today</p>
        </div>

        <div className="px-8 py-7 space-y-5">

          {/* Account Type Toggle */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">I want to join as:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsSeller(false)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 text-sm font-semibold transition-all ${
                  !isSeller
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">🛍️</span>
                Customer
                {!isSeller && <span className="text-[10px] uppercase tracking-widest text-indigo-500">Selected</span>}
              </button>
              <button
                type="button"
                onClick={() => setIsSeller(true)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 text-sm font-semibold transition-all ${
                  isSeller
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">🏪</span>
                Seller
                {isSeller && <span className="text-[10px] uppercase tracking-widest text-purple-500">Selected</span>}
              </button>
            </div>
            {isSeller && (
              <p className="mt-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700">
                You'll have a dedicated seller dashboard to list and manage your products.
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              name="username"
              placeholder="Choose a username"
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition text-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 ${
              isSeller
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            }`}
          >
            {isSubmitting ? "Creating account..." : isSeller ? "Create Seller Account" : "Create Account"}
          </button>

          {/* Login link */}
          <p className="text-sm text-slate-500 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
