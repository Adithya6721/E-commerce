import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Flame, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../services/cartService";
import { getProducts, type Product } from "../services/productService";

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
    return () => {
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

  const featuredProduct = trendingProducts[0];

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

        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-amber-300">
                <Sparkles className="h-4 w-4" />
                Trending storefront
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Discover live product collections with smarter filters and trending picks.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Browse dynamic categories, track stock-sensitive trends, and shop a cleaner catalog experience built from your real backend data.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  <Flame className="h-4 w-4 text-amber-300" />
                  {trendingProducts.length} trending picks
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  {categories.length - 1} live categories
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              {featuredProduct ? (
                <>
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Featured now</p>
                  <img
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    className="mt-4 h-56 w-full rounded-[1.5rem] object-cover"
                  />
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">
                        {featuredProduct.category}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">{featuredProduct.name}</h2>
                      <p className="mt-2 text-sm text-slate-300">
                        {(featuredProduct.description || "Freshly curated product").slice(0, 90)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                      Rs {featuredProduct.price}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center rounded-[1.5rem] border border-dashed border-white/20 text-sm text-slate-300">
                  Featured products will appear here once your catalog loads.
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
                  <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Trending
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">{product.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{product.stock} units in stock</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">Rs {product.price}</span>
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
                        <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                          Few left
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-1 pb-1 pt-4">
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {product.description || "A curated product from your live catalog."}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">Rs {product.price}</span>
                      <span className="text-slate-500">Stock: {product.stock}</span>
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
