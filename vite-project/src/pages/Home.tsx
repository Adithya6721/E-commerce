import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../services/cartService";
import { getProducts, type Product } from "../services/productService";
import { isInWishlist, toggleWishlist, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";
import { Heart } from "lucide-react";
import GlowFollowCard from "../components/ui/GlowFollowCard";
import { ContainerScroll } from "../components/ui/container-scroll-animation";
import { ScrollSequenceCanvas } from "../components/ui/scroll-sequence-canvas";
import { CoverflowCarousel } from "../components/ui/coverflow-carousel";

type SortOption = "featured" | "price-asc" | "price-desc" | "stock-desc";

// ─── Border-Beam Product Card ─────────────────────────────────────────────────
function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isPending,
  isWishlisted,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => boolean;
  isPending: boolean;
  isWishlisted: boolean;
}) {
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <GlowFollowCard>
      <Link 
        to={`/products/${product.id}`} 
        className="block relative overflow-hidden transition-colors hover:bg-white/50"
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height: 220 }}>
          <img
            src={product.image}
            alt={product.name}
            className="product-img-zoom h-full w-full object-cover"
          />
          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-2 flex-wrap">
            <span className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-800 shadow-sm">
              {product.category}
            </span>
            {discountPct && (
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                {discountPct}% OFF
              </span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                Only {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Out of Stock
              </span>
            )}
          </div>
          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md ${
              isWishlisted
                ? "bg-rose-500 text-white shadow-rose-400/40"
                : "bg-white/80 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
          {/* Rating overlay */}
          {product.averageRating != null && product.averageRating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2.5 py-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">{product.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-1">{product.name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description || "A curated product from your live catalog."}
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              {product.originalPrice && product.originalPrice > product.price ? (
                <>
                  <span className="block text-[11px] text-slate-400 line-through">
                    Rs {product.originalPrice.toLocaleString()}
                  </span>
                  <span className="block text-lg font-bold text-slate-900">
                    Rs {product.price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="block text-lg font-bold text-slate-900">
                  Rs {product.price.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium mb-0.5">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isPending || product.stock === 0}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isPending ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </Link>
    </GlowFollowCard>
  );
}

// ─── Autocomplete Search ──────────────────────────────────────────────────────
function SearchWithAutocomplete({
  value,
  onChange,
  products,
}: {
  value: string;
  onChange: (v: string) => void;
  products: Product[];
}) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q))
      .slice(0, 7);
  }, [value, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Search products, categories..."
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
      {showDropdown && (
        <div className="autocomplete-dropdown">
          {suggestions.map((p) => (
            <button
              key={p.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(p.name);
                setFocused(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-indigo-50 transition-colors"
            >
              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.category} · Rs {p.price.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [maxPrice, setMaxPrice] = useState(500000);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  const [wishlistCache, setWishlistCache] = useState<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const { username } = useAuth();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProducts();
        setProducts(data);
        const highest = data.reduce((m, p) => Math.max(m, p.price), 0);
        setMaxPrice(Math.max(highest, 5000));
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Could not load products.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const update = () => setWishlistCache({});
    window.addEventListener(WISHLIST_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, update);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const showMessage = (msg: string, tone: "success" | "error") => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setMessage(msg);
    setMessageTone(tone);
    timeoutRef.current = window.setTimeout(() => { setMessage(""); timeoutRef.current = null; }, 2500);
  };

  const categories = useMemo(() => {
    const dyn = Array.from(new Set(products.map((p) => p.category || "General")));
    return ["All", ...dyn];
  }, [products]);

  const trendingProducts = useMemo(() =>
    [...products]
      .sort((a, b) => {
        const sa = a.price * 0.35 + Math.max(20 - a.stock, 0) * 120;
        const sb = b.price * 0.35 + Math.max(20 - b.stock, 0) * 120;
        return sb - sa;
      })
      .slice(0, 4),
    [products]
  );



  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchPrice = p.price <= maxPrice;
      return matchSearch && matchCat && matchPrice;
    });
    switch (sortBy) {
      case "price-asc": return [...base].sort((a, b) => a.price - b.price);
      case "price-desc": return [...base].sort((a, b) => b.price - a.price);
      case "stock-desc": return [...base].sort((a, b) => b.stock - a.stock);
      default: return [...base].sort((a, b) => {
        const sa = a.price * 0.35 + Math.max(20 - a.stock, 0) * 120;
        const sb = b.price * 0.35 + Math.max(20 - b.stock, 0) * 120;
        return sb - sa;
      });
    }
  }, [activeCategory, maxPrice, products, search, sortBy]);

  const handleAdd = async (product: Product) => {
    if (!username) { showMessage("Login first to add items.", "error"); return; }
    try {
      setPendingProductId(product.id);
      await addToCart(username, { productId: product.id, quantity: 1 });
      showMessage(`${product.name} added to cart!`, "success");
    } catch { showMessage("Could not add item.", "error"); }
    finally { setPendingProductId(null); }
  };

  const handleWishlist = (productId: string) => {
    const added = toggleWishlist(productId);
    setWishlistCache((prev) => ({ ...prev, [productId]: added }));
    showMessage(added ? "Added to wishlist ❤️" : "Removed from wishlist", "success");
    return added;
  };

  const isWishlisted = (id: string) => wishlistCache[id] ?? isInWishlist(id);

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Navbar with dark theme text override for the hero section */}
      <div className="dark-nav-wrapper">
        <Navbar />
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl transition-all ${
            messageTone === "success"
              ? "bg-slate-900 text-white"
              : "bg-rose-600 text-white"
          }`}
          style={{ animation: "slide-up 0.25s ease-out" }}
        >
          <span>{messageTone === "success" ? "✓" : "✕"}</span>
          {message}
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity:0; transform: translateY(10px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>

        {/* ── 1. Container Scroll Hero ─────────────────────────────────────── */}
        <div className="w-full relative">
          {/* Cosmic Background Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="absolute bottom-[20%] right-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[150px]" />
            <div className="absolute top-[40%] right-[20%] h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
            {/* Stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 3 + 1 + "px",
                  height: Math.random() * 3 + 1 + "px",
                  top: Math.random() * 100 + "%",
                  left: Math.random() * 100 + "%",
                  opacity: Math.random() * 0.4 + 0.1,
                }}
                animate={{
                  y: [0, Math.random() * -50 - 20, 0],
                  opacity: [0.1, 0.8, 0.1]
                }}
                transition={{
                  duration: Math.random() * 5 + 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <ContainerScroll
            titleComponent={
              <div className="mb-4 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200 mb-6"
                >
                  <Sparkles className="h-4 w-4" />
                  Premium Collection
                </motion.div>
                <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight pb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">Engineering</span> <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 drop-shadow-lg">Perfected.</span>
                </h1>
              </div>
            }
          >
            {/* Using the smartwatch image you provided (or a placeholder matching the vibe) */}
            <img
              src="/images/sequence/ezgif-frame-001.jpg"
              alt="Smartwatch Exploded View"
              className="mx-auto rounded-2xl object-cover h-full w-full object-center"
              draggable={false}
            />
          </ContainerScroll>
        </div>

        {/* ── 2. Scroll Sequence Animation ─────────────────────────────────── */}
        <ScrollSequenceCanvas 
          frameCount={200}
          imagePathLoader={(index) => {
            if (index === 200) {
              return `/images/exploded-watch-hero.png`;
            }
            const padded = index.toString().padStart(3, '0');
            return `/images/sequence/ezgif-frame-${padded}.jpg`;
          }}
        />

        {/* ── 3. 3D Coverflow Carousel ───────────────────────────────────── */}
        <CoverflowCarousel products={trendingProducts} />

        {/* ── Catalog Section Transition ─────────────────────────────────── */}
        <div className="w-full bg-slate-950 pb-20">
          <div className="h-24 w-full bg-gradient-to-b from-transparent to-slate-50" />
        </div>

        <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 bg-slate-50 rounded-t-[3rem] shadow-2xl relative z-10 -mt-10">
          <div className="pt-16" />

        {/* ── Trending Row ───────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">Trending row</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Hot picks right now</h2>
            </div>
            <span className="text-sm text-slate-500">Driven by price and stock signals</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trendingProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAdd}
                onToggleWishlist={handleWishlist}
                isPending={pendingProductId === product.id}
                isWishlisted={isWishlisted(product.id)}
              />
            ))}
          </div>
        </section>

        {/* ── Search & Filters ───────────────────────────────────────────── */}
        <section className="mt-10 space-y-4">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 backdrop-blur p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <SearchWithAutocomplete value={search} onChange={setSearch} products={products} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 cursor-pointer">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-semibold text-slate-900 outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-desc">Highest Stock</option>
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Max price
                <input type="range" min={0} max={Math.max(maxPrice, 5000)} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-28 accent-indigo-600" />
                <span className="font-semibold text-slate-900 whitespace-nowrap">Rs {maxPrice.toLocaleString()}</span>
              </label>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Full Catalog ───────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">Dynamic catalog</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Shop the full collection</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
              Could not load products: {loadError}
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                  <div className="h-52 animate-pulse bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
              <h3 className="text-xl font-semibold text-slate-900">No products match this filter</h3>
              <p className="mt-2 text-sm text-slate-500">Try a different category, raise the price cap, or search for another keyword.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAdd}
                  onToggleWishlist={handleWishlist}
                  isPending={pendingProductId === product.id}
                  isWishlisted={isWishlisted(product.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
