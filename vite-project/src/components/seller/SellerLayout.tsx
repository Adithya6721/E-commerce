import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";

export default function SellerLayout() {
  const { pathname } = useLocation();
  const { username, logout } = useAuth();

  const links = [
    { to: "/seller", icon: LayoutDashboard, label: "Overview" },
    { to: "/seller/products", icon: Package, label: "My Products" },
    { to: "/seller/orders", icon: ShoppingCart, label: "Orders" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">Seller Hub</span>
        </div>

        <div className="p-4 px-6 border-b border-slate-100">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Store Owner</p>
          <p className="text-sm font-bold text-slate-800 truncate">{username}</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map((link) => {
            const isActive = pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
