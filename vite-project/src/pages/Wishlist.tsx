import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getWishlist, toggleWishlist, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";
import { getProductById, type Product } from "../services/productService";
import { Heart, ShoppingCart, Trash2, ArrowUpDown, ShoppingBag } from "lucide-react";
import { addToCart } from "../services/cartService";

// ─── Inline Toast ─────────────────────────────────────────────────────────────
type ToastMsg = { id: number; message: string; tone: "success" | "error" };
let _toastId = 0;

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl transition-all animate-slide-up ${
            t.tone === "success"
              ? "bg-slate-900 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{t.tone === "success" ? "✓" : "✕"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

type SortKey = "default" | "price-asc" | "price-desc" | "name";

export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingAll, setAddingAll] = useState(false);
  const [sort, setSort] = useState<SortKey>("default");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const { username } = useAuth();

  const pushToast = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    const ids = getWishlist();
    if (ids.length === 0) { setWishlistProducts([]); setIsLoading(false); return; }
    try {
      const products = await Promise.all(ids.map((id) => getProductById(id).catch(() => null)));
      setWishlistProducts(products.filter((p): p is Product => p !== null));
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void loadWishlist();
    const handleUpdate = () => void loadWishlist();
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
  }, [loadWishlist]);

  const handleRemove = (productId: string, name: string) => {
    toggleWishlist(productId);
    pushToast(`"${name}" removed from wishlist`);
  };

  const handleAddToCart = async (product: Product) => {
    if (!username) { pushToast("Please login first.", "error"); return; }
    if (product.stock === 0) { pushToast("This product is out of stock.", "error"); return; }
    try {
      await addToCart(username, { productId: product.id, quantity: 1 });
      toggleWishlist(product.id); // Remove from wishlist after adding to cart
      pushToast(`"${product.name}" added to cart!`);
    } catch {
      pushToast("Failed to add to cart.", "error");
    }
  };

  const handleAddAllToCart = async () => {
    if (!username) { pushToast("Please login first.", "error"); return; }
    const available = wishlistProducts.filter((p) => p.stock > 0);
    if (available.length === 0) { pushToast("No in-stock items to add.", "error"); return; }
    setAddingAll(true);
    let added = 0;
    for (const p of available) {
      try {
        await addToCart(username, { productId: p.id, quantity: 1 });
        toggleWishlist(p.id);
        added++;
      } catch { /* skip individual failures */ }
    }
    setAddingAll(false);
    pushToast(`${added} item${added !== 1 ? "s" : ""} moved to cart!`);
  };

  // ── Sorted products ───────────────────────────────────────────────────────
  const sorted = [...wishlistProducts].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const inStockCount = wishlistProducts.filter((p) => p.stock > 0).length;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Wishlist</h1>
              {!isLoading && wishlistProducts.length > 0 && (
                <span className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                  {wishlistProducts.length} item{wishlistProducts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="mt-1 text-slate-500">Save items you love and buy them later.</p>
          </div>

          {!isLoading && wishlistProducts.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-transparent text-sm outline-none cursor-pointer"
                >
                  <option value="default">Sort: Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="name">Name: A → Z</option>
                </select>
              </div>

              {/* Move all to cart */}
              {inStockCount > 0 && (
                <button
                  onClick={() => void handleAddAllToCart()}
                  disabled={addingAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-60"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {addingAll ? "Adding..." : `Move all (${inStockCount}) to Cart`}
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[2rem] bg-white p-4 shadow-sm border border-slate-100 h-96" />
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
              <Heart className="h-8 w-8 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 text-slate-500">Explore our catalog and heart your favorite items.</p>
            <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sorted.map((product) => (
              <div key={product.id} className="group flex flex-col overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
                <Link to={`/products/${product.id}`} className="relative h-64 overflow-hidden bg-slate-50">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-800 shadow-sm">
                      {product.category}
                    </span>
                  </div>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                      <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-xl">Out of Stock</span>
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">Only {product.stock} left</span>
                    </div>
                  )}
                </Link>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/products/${product.id}`} className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate pr-2 hover:text-indigo-600 transition">{product.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{product.description}</p>
                    </Link>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 whitespace-nowrap">Rs {product.price.toLocaleString()}</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-xs text-slate-400 line-through">Rs {product.originalPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex gap-3">
                    <button
                      onClick={() => handleRemove(product.id, product.name)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 focus:outline-none"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => void handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:shadow-lg hover:shadow-indigo-600/20"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
