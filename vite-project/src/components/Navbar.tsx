import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CART_UPDATED_EVENT, getCart } from "../services/cartService";
import { getWishlistCount, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";

export default function Navbar() {
  const { username, role, logout } = useAuth();
  const { pathname } = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevCartCount = useRef(0);

  // Scroll effect — glassmorphism on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart count — CUSTOMER only
  useEffect(() => {
    if (role !== "CUSTOMER") { setCartCount(0); return; }
    let cancelled = false;

    const loadCartCount = async () => {
      if (!username) { setCartCount(0); return; }
      try {
        const cart = await getCart(username);
        if (!cancelled) {
          const newCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          if (newCount > prevCartCount.current && prevCartCount.current > 0) {
            setCartBounce(true);
            setTimeout(() => setCartBounce(false), 400);
          }
          prevCartCount.current = newCount;
          setCartCount(newCount);
        }
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };

    void loadCartCount();
    const onCartUpdated = () => void loadCartCount();
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => { cancelled = true; window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated); };
  }, [username, role]);

  // Wishlist count
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
      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        pathname === to
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-200/30"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ animation: "slide-down-in 0.5s ease-out" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <ShoppingBag className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-indigo-600">Shop</span>
            <span className="text-slate-900">App</span>
          </span>
        </Link>

        {/* Center navigation */}
        <div className="flex items-center gap-1">
          {role === "CUSTOMER" && (
            <>
              {navLink("/", "Home")}
              <Link
                to="/orders"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === "/orders"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/cart"
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === "/cart"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                Cart
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-semibold flex items-center justify-center shadow-lg shadow-rose-200/50 ${
                      cartBounce ? "animate-bounce" : ""
                    }`}
                    style={cartBounce ? { animation: "badge-bounce 0.4s ease-out" } : undefined}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 text-rose-500 hover:bg-rose-50 ${
                  pathname === "/wishlist" ? "bg-rose-50 ring-2 ring-rose-100" : ""
                }`}
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {role === "ADMIN" && navLink("/admin", "Admin Dashboard")}
          {role === "SELLER" && navLink("/seller", "Seller Dashboard")}
        </div>

        {/* Right side — user */}
        <div className="flex items-center gap-3">
          {username ? (
            <>
              <span className="text-sm text-slate-500">
                Hi, <span className="font-semibold text-slate-900">{username}</span>
                {role === "SELLER" && (
                  <span className="ml-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">Seller</span>
                )}
                {role === "ADMIN" && (
                  <span className="ml-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Admin</span>
                )}
              </span>
              <button
                onClick={logout}
                className="text-sm px-4 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm px-5 py-2.5 rounded-full bg-indigo-600 text-white font-semibold transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-200/50 active:scale-95">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
