import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { Lock, User, ArrowRight, ShoppingBag, Store, ShoppingCart } from "lucide-react";

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      void handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-bleed background image */}
      <img
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&fit=crop&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Bottom-left branding */}
      <div className="absolute bottom-0 left-0 z-10 p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ShopApp</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white max-w-md leading-tight">
          Start your journey with us today
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Free to Join", "Seller Dashboard", "Order Tracking"].map((tag) => (
            <span key={tag} className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/90">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Floating signup card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-black/20"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="mt-1 text-sm text-slate-500">Join our marketplace in seconds</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Account Type Toggle */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                I want to join as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSeller(false)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    !isSeller
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsSeller(true)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    isSeller
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  Seller
                </button>
              </div>
              {isSeller && (
                <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  You'll get a dedicated seller dashboard to list and manage your products.
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="username"
                  placeholder="Choose a username"
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  {isSeller ? "Create Seller Account" : "Create Account"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-slate-900 underline underline-offset-4 transition hover:text-indigo-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
