import { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Lock, User, ArrowRight, ShoppingBag, Zap } from "lucide-react";

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
      const auth = await login(data);
      if (auth.role === "ADMIN") {
        navigate("/admin");
      } else if (auth.role === "SELLER") {
        navigate("/seller");
      } else {
        navigate("/");
      }
    } catch {
      setError("Login failed. Please check your username and password.");
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
        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark overlay — sits at z-index 1 */}
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 1 }} />

      {/* Floating bokeh particles — sit above the overlay at z-index 2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        {[
          { w: 420, h: 420, left: '-5%',  top: '-10%', color: '#6366f1', dur: 8,  delay: 0 },
          { w: 320, h: 320, left: '65%',  top: '-5%',  color: '#a855f7', dur: 11, delay: 1.5 },
          { w: 360, h: 360, left: '72%',  top: '48%',  color: '#ec4899', dur: 9,  delay: 0.8 },
          { w: 290, h: 290, left: '10%',  top: '58%',  color: '#3b82f6', dur: 13, delay: 2 },
          { w: 310, h: 310, left: '38%',  top: '68%',  color: '#8b5cf6', dur: 10, delay: 0.5 },
          { w: 260, h: 260, left: '48%',  top: '12%',  color: '#f97316', dur: 12, delay: 1 },
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

      {/* Bottom-left branding — z-index 5 so it sits above bokeh */}
      <div className="absolute bottom-0 left-0 p-8 md:p-12" style={{ zIndex: 5 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ShopApp</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white max-w-md leading-tight">
          Discover curated collections from top sellers
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Verified Sellers", "Real-time Tracking", "Secure Payments"].map((tag) => (
            <span key={tag} className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/90">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Floating login card — z-index 10 so it appears on top of everything */}
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
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue shopping</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="username"
                  placeholder="Enter your username"
                  value={data.username}
                  onChange={handleChange("username")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={data.password}
                  onChange={handleChange("password")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
            </div>

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
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-slate-900 underline underline-offset-4 transition hover:text-indigo-600">
              Sign up
            </Link>
          </p>

          {/* ── DEV ONLY: Quick bypass login ─────────────────────────────── */}
          {import.meta.env.DEV && (
            <div className="mt-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Dev Quick Login</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Customer", role: "CUSTOMER", username: "testuser", path: "/" },
                  { label: "Seller",   role: "SELLER",   username: "testseller", path: "/seller" },
                  { label: "Admin",    role: "ADMIN",    username: "admin",      path: "/admin" },
                ].map(({ label, role, username, path }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      localStorage.setItem("token",    "dev-mock-token");
                      localStorage.setItem("username", username);
                      localStorage.setItem("role",     role);
                      navigate(path);
                      window.location.reload();
                    }}
                    className="rounded-xl bg-amber-100 border border-amber-200 px-2 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
