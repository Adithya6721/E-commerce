import { LayoutDashboard, LineChart, ShieldAlert, Users, Stamp, PackageSearch, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../Navbar";

const navItems = [
  { to: "/admin",           label: "Dashboard",    icon: LayoutDashboard, end: true, color: "#f59e0b" },
  { to: "/admin/sellers",   label: "Seller Apps",  icon: Stamp,           color: "#8b5cf6" },
  { to: "/admin/orders",    label: "Global Orders", icon: PackageSearch,  color: "#3b82f6" },
  { to: "/admin/products",  label: "Moderation",   icon: ShieldAlert,     color: "#ef4444" },
  { to: "/admin/users",     label: "Users",        icon: Users,           color: "#10b981" },
  { to: "/admin/analytics", label: "Analytics",    icon: LineChart,       color: "#6366f1" },
];

export default function AdminLayout() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #fef9e7 0%, #f8fafc 20%, #f0f4ff 60%, #e2e8f0 100%)" }}
    >
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] }}
          className="lg:sticky lg:top-24 lg:h-fit lg:w-72"
        >
          <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                transition={{ duration: 0.45 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400"
              >
                <ShieldCheck className="h-5 w-5 text-slate-900" />
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin Panel</p>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  Store Ops
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Manage inventory, users, and analytics from one place.
            </p>

            {/* Nav */}
            <nav className="space-y-1">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.35, ease: "easeOut" } as any}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                    >
                      {({ isActive }) => (
                        <motion.div
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                              : "text-slate-400 hover:text-white"
                          }`}
                          style={
                            !isActive
                              ? { ["--hover-bg" as string]: `${item.color}20` }
                              : undefined
                          }
                        >
                          {/* Hover background glow */}
                          {!isActive && (
                            <motion.span
                              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
                              style={{ background: `${item.color}18` }}
                              whileHover={{ opacity: 1 }}
                            />
                          )}

                          {/* Animated icon */}
                          <motion.div
                            whileHover={{ scale: 1.3, rotate: 10 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 450, damping: 16 }}
                            className="relative z-10 flex-shrink-0"
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: isActive ? item.color : undefined }}
                            />
                          </motion.div>

                          <span className="relative z-10">{item.label}</span>

                          {/* Active coloured dot */}
                          {isActive && (
                            <motion.span
                              className="ml-auto h-2 w-2 rounded-full"
                              style={{ background: item.color }}
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                        </motion.div>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" } as any}
          className="min-w-0 flex-1"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
