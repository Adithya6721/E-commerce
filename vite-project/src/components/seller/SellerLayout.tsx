import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Loader2 } from "lucide-react";
import { getMySellerProfile, type SellerProfile } from "../../services/sellerService";
import SellerOnboarding from "../../pages/seller/SellerOnboarding";

export default function SellerLayout() {
  const { pathname } = useLocation();
  const { username, logout } = useAuth();
  
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMySellerProfile();
        setProfile(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setProfile(null); // Needs to onboard
        }
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const links = [
    { to: "/seller", icon: LayoutDashboard, label: "Overview" },
    { to: "/seller/products", icon: Package, label: "My Products" },
    { to: "/seller/orders", icon: ShoppingCart, label: "Orders" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading your seller profile...</p>
      </div>
    );
  }

  // Intercept if not verified or doesn't have a profile
  if (!profile || profile.verificationStatus !== "VERIFIED") {
    return (
      <div className="flex h-screen w-full relative">
        <SellerOnboarding 
          status={profile?.verificationStatus}
          onSuccess={(newProfile) => setProfile(newProfile)} 
        />
        <div className="absolute top-6 right-6">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
