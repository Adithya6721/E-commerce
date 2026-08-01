import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { register } from "../services/authService";
import { Lock, User, Mail, ArrowRight, ShoppingBag, Store, ShoppingCart } from "lucide-react";

export default function Register() {
  const [data, setData] = useState({ username: "", password: "", email: "" });
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!data.username.trim() || !data.password.trim() || !data.email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        username: data.username,
        password: data.password,
        email: data.email,
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
      {/* Dark overlay — z-index 1 */}
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 1 }} />

      {/* Floating bokeh particles — above overlay at z-index 2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        {[
          { w: 430, h: 430, left: '-5%',  top: '-10%', color: '#a855f7', dur: 9,  delay: 0 },
          { w: 320, h: 320, left: '68%',  top: '-5%',  color: '#6366f1', dur: 12, delay: 1.5 },
          { w: 360, h: 360, left: '70%',  top: '52%',  color: '#ec4899', dur: 10, delay: 0.8 },
          { w: 290, h: 290, left: '10%',  top: '62%',  color: '#3b82f6', dur: 13, delay: 2 },
          { w: 310, h: 310, left: '36%',  top: '72%',  color: '#8b5cf6', dur: 11, delay: 0.5 },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.w,
              height: p.h,
              left: p.left,
              top: p.top,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${p.color}cc 0%, ${p.color}55 45%, transparent 70%)`,
              filter: 'blur(70px)',
              opacity: 0.55,
              animation: `bokeh-float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Bottom-left branding — z-index 5 */}
      <div className="absolute bottom-0 left-0 p-8 md:p-12" style={{ zIndex: 5 }}>
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

      {/* Floating signup card — z-index 10 */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.23, 0.86, 0.39, 0.96] }}
        style={{ zIndex: 10 }}
        className="relative w-full max-w-md mx-4"
      >
        <div
          className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-3xl p-8 md:p-10 shadow-2xl shadow-black/20 border border-white/40"
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

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Used to send order confirmation emails</p>
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
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="btn-shimmer group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
            </motion.button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-slate-900 underline underline-offset-4 transition hover:text-indigo-600">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
