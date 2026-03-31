import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../services/cartService";
import { getProducts, type Product } from "../services/productService";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { username } = useAuth();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setFiltered(data);
    });
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

  const handleSearch = (term: string) => {
    setSearch(term);
    setFiltered(
      products.filter((product) =>
        product.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  const handleAdd = async (product: Product) => {
    if (!username) {
      alert("Login first");
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
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
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

        <div className="relative mb-10">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            Search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-20 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <span className="text-sm text-gray-400">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400 text-lg">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-100 transition-all bg-white"
              >
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">
                  {product.category}
                </p>

                <h3 className="text-base font-semibold text-gray-800 truncate mb-1">
                  {product.name}
                </h3>

                <p className="text-sm text-gray-400 mb-1">
                  Stock: {product.stock}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-indigo-600">
                    Rs {product.price}
                  </span>
                  <button
                    onClick={() => void handleAdd(product)}
                    disabled={pendingProductId === product.id}
                    className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {pendingProductId === product.id ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
