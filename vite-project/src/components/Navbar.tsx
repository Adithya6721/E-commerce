import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CART_UPDATED_EVENT, getCart } from "../services/cartService";

export default function Navbar() {
  const { username, logout } = useAuth();
  const { pathname } = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCartCount = async () => {
      if (!username) {
        setCartCount(0);
        return;
      }

      try {
        const cart = await getCart(username);
        if (!cancelled) {
          const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(total);
        }
      } catch {
        if (!cancelled) {
          setCartCount(0);
        }
      }
    };

    void loadCartCount();

    const handleCartUpdated = () => {
      void loadCartCount();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [username]);

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
        <span className="text-xl font-bold text-indigo-600 tracking-tight">
          ShopApp
        </span>

        <div className="flex items-center gap-1">
          {navLink("/", "Home")}
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
        </div>

        <div className="flex items-center gap-3">
          {username ? (
            <>
              <span className="text-sm text-gray-600">
                Hi, <span className="font-semibold text-gray-900">{username}</span>
              </span>
              <button
                onClick={logout}
                className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
