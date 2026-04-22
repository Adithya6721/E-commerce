import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Flame, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../services/cartService";
import { getProducts, type Product } from "../services/productService";
import { isInWishlist, toggleWishlist, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";
import { Heart } from "lucide-react";

type SortOption = "featured" | "price-asc" | "price-desc" | "stock-desc";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [wishlistCache, setWishlistCache] = useState<Record<string, boolean>>({});
  const timeoutRef = useRef<number | null>(null);
  const { username } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProducts();
        setProducts(data);
        const highestPrice = data.reduce((max, product) => Math.max(max, product.price), 0);
        setMaxPrice(Math.max(highestPrice, 5000));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not load products.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    const updateWishlist = () => {
      // Just force a re-render or sync complex state if needed. Easiest is to update a timestamp or similar, but recalculating isInWishlist is fast.
      setWishlistCache({}); // clear cache to force updates
    };
    window.addEventListener(WISHLIST_UPDATED_EVENT, updateWishlist);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, updateWishlist);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showMessage = (nextMessage: string, tone: "success" | "error") => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setMessage(nextMessage);
    setMessageTone(tone);
    timeoutRef.current = window.setTimeout(() => {
      setMessage("");
      timeoutRef.current = null;
    }, 2500);
  };

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(products.map((product) => product.category || "General"))
    );
    return ["All", ...dynamicCategories];
  }, [products]);

  const trendingProducts = useMemo(() => {
    return [...products]
      .sort((left, right) => {
        const leftScore = left.price * 0.35 + Math.max(20 - left.stock, 0) * 120;
        const rightScore = right.price * 0.35 + Math.max(20 - right.stock, 0) * 120;
        return rightScore - leftScore;
      })
      .slice(0, 4);
  }, [products]);

  const featuredProduct = trendingProducts[carouselIndex % Math.max(1, trendingProducts.length)];

  useEffect(() => {
    if (trendingProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % trendingProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [trendingProducts.length]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const base = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? "").toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesPrice = product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    switch (sortBy) {
      case "price-asc":
        return [...base].sort((left, right) => left.price - right.price);
      case "price-desc":
        return [...base].sort((left, right) => right.price - left.price);
      case "stock-desc":
        return [...base].sort((left, right) => right.stock - left.stock);
      default:
        return [...base].sort((left, right) => {
          const leftScore = left.price * 0.35 + Math.max(20 - left.stock, 0) * 120;
          const rightScore = right.price * 0.35 + Math.max(20 - right.stock, 0) * 120;
          return rightScore - leftScore;
        });
    }
  }, [activeCategory, maxPrice, products, search, sortBy]);

  const handleAdd = async (product: Product) => {
    if (!username) {
      showMessage("Login first to add products to cart.", "error");
      return;
    }

    try {
      setPendingProductId(product.id);
      await addToCart(username, { productId: product.id, quantity: 1 });
      showMessage(`${product.name} added to cart.`, "success");
    } catch {
      showMessage("Could not add item to cart. Please try again.", "error");
    } finally {
      setPendingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_38%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm font-medium ${
              messageTone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-[2.5rem] bg-indigo-50/50 border border-indigo-100 text-slate-900 shadow-xl shadow-indigo-100/50">
          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-14">
            <div className="flex flex-col justify-center">
              <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Trending storefront
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                Discover live product collections with smarter filters.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                Browse dynamic categories, track stock-sensitive trends, and shop a cleaner catalog experience built from your real backend data.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <Flame className="h-4 w-4 text-rose-500" />
                  {trendingProducts.length} trending picks
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  {categories.length - 1} live categories
                </div>
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-indigo-200/40">
              {featuredProduct ? (
                <div className="group animate-in fade-in slide-in-from-right-4 duration-700 block">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Featured now</p>
                    <div className="flex gap-1">
                      {trendingProducts.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="relative mt-4 overflow-hidden rounded-[1.5rem] bg-slate-50">
                    <img
                      src={featuredProduct.image}
                      alt={featuredProduct.name}
                      className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4 px-1">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{featuredProduct.name}</h2>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                        {featuredProduct.description || "Freshly curated product"}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 whitespace-nowrap">
                      Rs {featuredProduct.price}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 text-sm text-slate-500 bg-slate-50">
                  Featured products will appear here.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">Trending row</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Hot picks right now</h2>
            </div>
            <span className="text-sm text-slate-500">Driven by price and stock signals</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trendingProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative">
                  <img src={product.image} alt={product.name} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 rounded-full bg-slate-900/80 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-sm">
                    Trending
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const added = toggleWishlist(product.id);
                      setWishlistCache(prev => ({...prev, [product.id]: added}));
                      showMessage(added ? "Added to wishlist" : "Removed from wishlist", "success");
                    }}
                    className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all ${
                      (wishlistCache[product.id] ?? isInWishlist(product.id))
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-white/80 text-slate-400 hover:bg-rose-50 hover:text-rose-500 shadow-sm"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${(wishlistCache[product.id] ?? isInWishlist(product.id)) ? "fill-current" : ""}`} />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">{product.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{product.stock} units in stock</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      {product.originalPrice && product.originalPrice > product.price ? (
                        <>
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-semibold text-rose-500 line-through">Rs {product.originalPrice}</span>
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                          <span className="block text-lg font-bold text-slate-900">Rs {product.price}</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-slate-900">Rs {product.price}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleAdd(product); }}
                      disabled={pendingProductId === product.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-400"
                    >
                      {pendingProductId === product.id ? "Adding..." : "Add"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/90 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name or description"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
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
                <input
                  type="range"
                  min={0}
                  max={Math.max(maxPrice, 5000)}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-28 accent-indigo-600"
                />
                <span className="font-semibold text-slate-900">Rs {maxPrice}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === category
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">Dynamic catalog</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Shop the full collection</h2>
            </div>
            <span className="text-sm text-slate-500">
              {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
              Could not load products: {loadError}
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                  <div className="h-44 animate-pulse rounded-[1.5rem] bg-slate-100" />
                  <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-6 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 h-10 w-full animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
              <h3 className="text-xl font-semibold text-slate-900">No products match this filter</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different category, raise the price cap, or search for another keyword.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group overflow-hidden rounded-[2rem] border border-white bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden rounded-[1.5rem]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {product.category}
                      </span>
                      {product.stock <= 5 && (
                        <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-950 shadow-sm">
                          Few left
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = toggleWishlist(product.id);
                        setWishlistCache(prev => ({...prev, [product.id]: added}));
                        showMessage(added ? "Added to wishlist" : "Removed from wishlist", "success");
                      }}
                      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all ${
                        (wishlistCache[product.id] ?? isInWishlist(product.id))
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                          : "bg-white/80 text-slate-400 hover:bg-rose-50 hover:text-rose-500 shadow-sm"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${(wishlistCache[product.id] ?? isInWishlist(product.id)) ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="px-1 pb-1 pt-4">
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {product.description || "A curated product from your live catalog."}
                    </p>
                    <div className="mt-4 flex items-end justify-between text-sm">
                      <div>
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <>
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-medium text-rose-500 line-through">Rs {product.originalPrice}</span>
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                              </span>
                            </div>
                            <span className="block font-bold text-slate-900 text-base">Rs {product.price}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-900 text-base">Rs {product.price}</span>
                        )}
                      </div>
                      <span className="text-slate-500 font-medium mb-0.5">Stock: {product.stock}</span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleAdd(product); }}
                      disabled={pendingProductId === product.id}
                      className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {pendingProductId === product.id ? "Adding..." : "Add to Cart"}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
