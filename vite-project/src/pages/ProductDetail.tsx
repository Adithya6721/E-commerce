import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../services/cartService";
import { getProductById, getProducts, type Product } from "../services/productService";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { username } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const timeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setIsLoading(true);
      setLoadError(null);
      setQuantity(1);

      try {
        const [productData, allProducts] = await Promise.all([
          getProductById(id),
          getProducts(),
        ]);

        if (!cancelled) {
          setProduct(productData);
          const related = allProducts
            .filter(
              (p) =>
                p.category === productData.category && p.id !== productData.id
            )
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load product."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();
    window.scrollTo(0, 0);

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stockLabel = useMemo(() => {
    if (!product) return "";
    if (product.stock === 0) return "Out of Stock";
    if (product.stock <= 5) return `Only ${product.stock} left!`;
    return "In Stock";
  }, [product]);

  const stockColor = useMemo(() => {
    if (!product) return "";
    if (product.stock === 0) return "text-rose-600";
    if (product.stock <= 5) return "text-amber-600";
    return "text-emerald-600";
  }, [product]);

  const handleAddToCart = async () => {
    if (!username) {
      showMessage("Login first to add products to cart.", "error");
      return;
    }
    if (!product || product.stock === 0) return;

    try {
      setIsAddingToCart(true);
      await addToCart(username, { productId: product.id, quantity });
      showMessage(`${product.name} (×${quantity}) added to cart.`, "success");
    } catch {
      showMessage("Could not add item to cart. Please try again.", "error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_38%,#f8fafc_100%)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="h-[500px] animate-pulse rounded-[2rem] bg-slate-100" />
            <div className="space-y-6">
              <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-14 w-48 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_38%,#f8fafc_100%)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-rose-700">
            {loadError || "Product not found."}
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_38%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="transition hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-400">{product.category}</span>
          <span>/</span>
          <span className="font-medium text-slate-900">{product.name}</span>
        </nav>

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

        {/* Product main section */}
        <section className="grid gap-10 lg:grid-cols-2">
          {/* Image */}
          <div className="group overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
            <div className="relative overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-[500px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {product.category}
                </span>
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                    Few left
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    Sold out
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
              {product.category}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-slate-500">(No reviews yet)</span>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              {product.description || "A curated product from your live catalog."}
            </p>

            <div className="mt-6 flex items-end gap-4">
              <div>
                {product.originalPrice && product.originalPrice > product.price ? (
                  <>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-lg font-semibold text-rose-500 line-through">Rs {product.originalPrice}</span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </div>
                    <span className="text-4xl font-bold text-slate-900">
                      Rs {product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-slate-900">
                    Rs {product.price}
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold pb-1 ${stockColor}`}>
                {stockLabel}
              </span>
            </div>

            {/* Quantity selector + Add to cart */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={product.stock === 0}
                  className="h-12 w-12 rounded-xl text-lg font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <Minus className="mx-auto h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={product.stock === 0}
                  className="h-12 w-12 rounded-xl text-lg font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <Plus className="mx-auto h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => void handleAddToCart()}
                disabled={product.stock === 0 || isAddingToCart}
                className="inline-flex items-center gap-3 rounded-full bg-indigo-600 px-8 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0
                  ? "Out of Stock"
                  : isAddingToCart
                    ? "Adding..."
                    : "Add to Cart"}
              </button>

              <button className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* Additional info */}
            <div className="mt-8 space-y-3 rounded-[2rem] bg-slate-50 p-5 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Stock available</span>
                <span className="font-semibold text-slate-900">{product.stock} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery estimate</span>
                <span className="font-semibold text-slate-900">4-5 business days</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Free shipping</span>
                <span className="font-semibold text-slate-900">Orders above Rs 20,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">
                Related products
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                More in {product.category}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  to={`/products/${related.id}`}
                  className="group overflow-hidden rounded-[2rem] border border-white bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden rounded-[1.5rem]">
                    <img
                      src={related.image}
                      alt={related.name}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        {related.category}
                      </span>
                    </div>
                  </div>
                  <div className="px-1 pb-1 pt-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {related.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {related.description ||
                        "A curated product from your live catalog."}
                    </p>
                    <div className="mt-4 flex items-end justify-between text-sm">
                      <div>
                        {related.originalPrice && related.originalPrice > related.price ? (
                          <>
                            <div className="flex gap-1 items-center">
                              <span className="text-xs font-medium text-rose-500 line-through">Rs {related.originalPrice}</span>
                              <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700">
                                {Math.round(((related.originalPrice - related.price) / related.originalPrice) * 100)}%
                              </span>
                            </div>
                            <span className="block font-bold text-slate-900 text-base">
                              Rs {related.price}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-900 text-base">
                            Rs {related.price}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-medium mb-0.5">
                        Stock: {related.stock}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
