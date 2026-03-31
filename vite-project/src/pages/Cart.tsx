import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  CART_UPDATED_EVENT,
  getCart,
  removeFromCart,
  type Cart as CartType,
  updateCartItemQuantity,
} from "../services/cartService";
import { getProductById, type Product } from "../services/productService";

export default function Cart() {
  const [cart, setCart] = useState<CartType | null>(null);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const { username } = useAuth();
  const userId = username || "";

  useEffect(() => {
    if (!userId) {
      setCart(null);
      return;
    }

    let cancelled = false;

    const loadCart = async () => {
      const nextCart = await getCart(userId);
      if (!cancelled) {
        setCart(nextCart);
      }
    };

    void loadCart();

    const handleCartUpdated = () => {
      void loadCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [userId]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setProductsMap({});
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      const entries = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const product = await getProductById(item.productId);
            return [item.productId, product] as const;
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setProductsMap(
          entries.reduce<Record<string, Product>>((map, entry) => {
            if (entry) {
              map[entry[0]] = entry[1];
            }
            return map;
          }, {})
        );
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [cart]);

  const refreshCart = async () => {
    if (!userId) {
      return;
    }

    const nextCart = await getCart(userId);
    setCart(nextCart);
  };

  const changeQuantity = async (productId: string, nextQuantity: number) => {
    try {
      setBusyProductId(productId);
      if (nextQuantity <= 0) {
        await removeFromCart(userId, productId);
      } else {
        await updateCartItemQuantity(userId, productId, nextQuantity);
      }
      await refreshCart();
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      setBusyProductId(productId);
      await removeFromCart(userId, productId);
      await refreshCart();
    } finally {
      setBusyProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h2>

        {!cart || cart.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-20 text-center text-lg text-gray-400">
            Your cart is empty.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item) => {
                const product = productsMap[item.productId];
                const linePrice = product ? product.price * item.quantity : 0;

                return (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-indigo-100 hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="h-24 w-full overflow-hidden rounded-2xl bg-gray-100 md:w-24">
                      {product ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">
                          Loading...
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
                        {product?.category ?? "Product"}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {product?.name ?? item.productId}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {product ? `Rs ${product.price} each` : "Fetching product details"}
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Line total: Rs {linePrice}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
                        <button
                          onClick={() => void changeQuantity(item.productId, item.quantity - 1)}
                          disabled={busyProductId === item.productId}
                          className="h-10 w-10 rounded-xl text-lg font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => void changeQuantity(item.productId, item.quantity + 1)}
                          disabled={busyProductId === item.productId}
                          className="h-10 w-10 rounded-xl text-lg font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => void handleRemove(item.productId)}
                        disabled={busyProductId === item.productId}
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between px-6 py-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-base font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-indigo-600">
                Rs {cart.totalPrice}
              </span>
            </div>

            <button className="mt-4 w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all">
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
