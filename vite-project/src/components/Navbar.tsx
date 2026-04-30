import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CART_UPDATED_EVENT, getCart } from "../services/cartService";
import { getWishlistCount, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";

export default function Navbar() {
  const { username, role, logout } = useAuth();
  const { pathname } = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Cart count — CUSTOMER only, live from backend
  useEffect(() => {
    if (role !== "CUSTOMER") { setCartCount(0); return; }
    let cancelled = false;

    const loadCartCount = async () => {
      if (!username) { setCartCount(0); return; }
      try {
        const cart = await getCart(username);
        if (!cancelled) setCartCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };

    void loadCartCount();
    const onCartUpdated = () => void loadCartCount();
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => { cancelled = true; window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated); };
  }, [username, role]);

  // Wishlist count — CUSTOMER only, from localStorage
  useEffect(() => {
    if (role !== "CUSTOMER") { setWishlistCount(0); return; }
    setWishlistCount(getWishlistCount());
    const onWishlistUpdated = () => setWishlistCount(getWishlistCount());
    window.addEventListener(WISHLIST_UPDATED_EVENT, onWishlistUpdated);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, onWishlistUpdated);
  }, [role]);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        pathname === to
          ? "bg-indigo-600 text-white shadow"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">ShopApp</span>

        <div className="flex items-center gap-1">
          {role === "CUSTOMER" && (
            <>
              {navLink("/", "Home")}
              <Link
                to="/orders"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  pathname === "/orders"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/cart"
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  pathname === "/cart"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-semibold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all text-rose-500 hover:bg-rose-50 ${pathname === "/wishlist" ? "bg-rose-50 ring-2 ring-rose-100" : ""}`}
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {role === "ADMIN" && navLink("/admin", "Admin Dashboard")}
          {role === "SELLER" && navLink("/seller", "Seller Dashboard")}
        </div>

        <div className="flex items-center gap-3">
          {username ? (
            <>
              <span className="text-sm text-gray-600">
                Hi, <span className="font-semibold text-gray-900">{username}</span>
                {role === "SELLER" && (
                  <span className="ml-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">Seller</span>
                )}
                {role === "ADMIN" && (
                  <span className="ml-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Admin</span>
                )}
              </span>
              <button
                onClick={logout}
                className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
