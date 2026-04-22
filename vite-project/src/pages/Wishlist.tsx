import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getWishlist, toggleWishlist, WISHLIST_UPDATED_EVENT } from "../services/wishlistService";
import { getProductById, type Product } from "../services/productService";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { addToCart } from "../services/cartService";

export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useAuth();

  const loadWishlist = async () => {
    setIsLoading(true);
    const wishlistIds = getWishlist();
    
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      const products = await Promise.all(
        wishlistIds.map(id => getProductById(id).catch(() => null))
      );
      setWishlistProducts(products.filter((p): p is Product => p !== null));
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
    
    const handleUpdate = () => void loadWishlist();
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
  }, []);

  const handleRemove = (productId: string) => {
    toggleWishlist(productId);
  };

  const handleAddToCart = async (product: object) => {
    const p = product as Product;
    if (!username) {
      alert("Please login first.");
      return;
    }
    if (p.stock === 0) return;
    
    try {
      await addToCart(username, { productId: p.id, quantity: 1 });
      handleRemove(p.id); // Remove from wishlist after adding to cart
      alert("Added to cart!");
    } catch {
      alert("Failed to add to cart.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Wishlist</h1>
          <p className="mt-2 text-slate-500">Save items you love and buy them later.</p>
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
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wishlistProducts.map((product) => (
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
                      <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-xl">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/products/${product.id}`} className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate pr-2 hover:text-indigo-600 transition">{product.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{product.description}</p>
                    </Link>
                    <p className="font-bold text-slate-900 whitespace-nowrap">Rs {product.price}</p>
                  </div>
                  
                  <div className="mt-auto pt-6 flex gap-3">
                    <button
                      onClick={() => handleRemove(product.id)}
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
