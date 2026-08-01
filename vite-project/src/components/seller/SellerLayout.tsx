import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Loader2, Store } from "lucide-react";
import { getMySellerProfile, type SellerProfile } from "../../services/sellerService";
import SellerOnboarding from "../../pages/seller/SellerOnboarding";

const links = [
  { to: "/seller",          icon: LayoutDashboard, label: "Overview",    color: "#6366f1" },
  { to: "/seller/products", icon: Package,          label: "My Products", color: "#8b5cf6" },
  { to: "/seller/orders",   icon: ShoppingCart,     label: "Orders",      color: "#ec4899" },
];

export default function SellerLayout() {
  const { pathname } = useLocation();
  const { username, logout } = useAuth();

  const [profile, setProfile]   = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMySellerProfile();
        setProfile(data);
      } catch (err: any) {
        if (err?.response?.status === 404) setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <p className="text-sm font-medium text-slate-500">Loading your seller profile...</p>
      </div>
    );
  }

  if (!profile || profile.verificationStatus !== "VERIFIED") {
    return (
      <div className="flex h-screen w-full relative">
        <SellerOnboarding
          status={profile?.verificationStatus}
          onSuccess={(newProfile) => setProfile(newProfile)}
        />
        <div className="absolute top-6 right-6">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #f8f0ff 100%)" }}
    >
      {/* ── Animated Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] }}
        className="w-64 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl flex flex-col shadow-xl shadow-slate-900/[0.04]"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100/60">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600"
          >
            <Store className="h-4 w-4 text-white" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-indigo-600">Seller</span>
            <span className="text-slate-900"> Hub</span>
          </span>
        </div>

        {/* Profile strip */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Store Owner</p>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-700 uppercase">
                {username?.[0] ?? "S"}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{username}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4">
          {links.map((link, i) => {
            const isActive = pathname === link.to;
            const Icon = link.icon;
            return (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: "easeOut" } as any}
              >
                <Link to={link.to} className="group relative block">
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-indigo-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${link.color}18 0%, ${link.color}08 100%)`
                        : undefined,
                    }}
                  >
                    {/* Animated left accent bar */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          layoutId="seller-active-bar"
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0 }}
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                          style={{ background: link.color }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Animated icon */}
                    <motion.div
                      whileHover={{ scale: 1.25, rotate: 8 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="flex-shrink-0"
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: isActive ? link.color : undefined }}
                      />
                    </motion.div>

                    <span>{link.label}</span>

                    {/* Active pulse dot */}
                    {isActive && (
                      <motion.span
                        className="ml-auto h-2 w-2 rounded-full"
                        style={{ background: link.color }}
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.96 }}
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
          >
            <motion.div
              whileHover={{ scale: 1.25, rotate: -12 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <LogOut className="h-5 w-5 text-rose-500" />
            </motion.div>
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex-1 overflow-y-auto"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
