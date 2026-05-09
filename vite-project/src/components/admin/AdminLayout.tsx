import { LayoutDashboard, LineChart, ShieldAlert, Users, Stamp, PackageSearch } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import Navbar from "../Navbar";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/sellers", label: "Seller Apps", icon: Stamp },
  { to: "/admin/orders", label: "Global Orders", icon: PackageSearch },
  { to: "/admin/products", label: "Moderation", icon: ShieldAlert },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #f8fafc 20%, #f0f4ff 60%, #e2e8f0 100%)' }}>
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-72">
          <div className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Admin Panel</p>
            <h2 className="mt-3 text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Store Operations</h2>
            <p className="mt-3 text-sm text-slate-300">
              Jump between inventory, users, and analytics without losing sight of backend health.
            </p>
            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-lg shadow-white/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
