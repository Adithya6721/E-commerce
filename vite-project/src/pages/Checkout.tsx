import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getCart,
  removeFromCart,
  type Cart,
} from "../services/cartService";
import { getProductById, type Product } from "../services/productService";
import {
  createOrderFromCart,
  type CheckoutFormData,
} from "../services/orderService";

const EMPTY_FORM: CheckoutFormData = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  paymentMethod: "CARD",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  upiId: "",
};

export default function Checkout() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const userId = username || "";
  const [cart, setCart] = useState<Cart | null>(null);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [form, setForm] = useState<CheckoutFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadCheckout = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextCart = await getCart(userId);
        if (cancelled) {
          return;
        }

        setCart(nextCart);

        const entries = await Promise.all(
          nextCart.items.map(async (item) => {
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
      } catch {
        if (!cancelled) {
          setError("Could not load checkout details.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const deliveryFee = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return 0;
    }
    return cart.totalPrice >= 20000 ? 0 : 149;
  }, [cart]);

  const grandTotal = (cart?.totalPrice ?? 0) + deliveryFee;

  const updateField = <K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.pincode) {
      return "Please fill in the delivery details.";
    }

    if (form.paymentMethod === "CARD") {
      if (!form.cardName || !form.cardNumber || !form.expiry || !form.cvv) {
        return "Please complete the card payment details.";
      }
    }

    if (form.paymentMethod === "UPI" && !form.upiId) {
      return "Please enter a UPI ID.";
    }

    return "";
  };

  const clearCart = async (currentCart: Cart) => {
    await Promise.all(
      currentCart.items.map((item) => removeFromCart(userId, item.productId))
    );
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const order = createOrderFromCart(userId, cart, productsMap, form);
      await clearCart(cart);
      navigate(`/orders/${order.id}`);
    } catch {
      setError("Could not place the order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#ffffff_42%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">Checkout</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complete your payment</h1>
            <p className="mt-2 text-sm text-slate-500">
              This is a frontend flow for now. Orders are stored locally until you connect a backend orders service.
            </p>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Back to Cart
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 rounded-[2rem] border border-white bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading checkout details...
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add products before moving to checkout.
            </p>
          </div>
        ) : (
          <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Delivery details</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" value={form.fullName} onChange={(value) => updateField("fullName", value)} />
                  <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
                  <Field label="City" value={form.city} onChange={(value) => updateField("city", value)} />
                  <Field label="Pincode" value={form.pincode} onChange={(value) => updateField("pincode", value)} />
                </div>
                <div className="mt-4">
                  <Field
                    label="Address"
                    value={form.address}
                    onChange={(value) => updateField("address", value)}
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Payment method</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    { value: "CARD", label: "Card" },
                    { value: "UPI", label: "UPI" },
                    { value: "COD", label: "Cash on Delivery" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateField("paymentMethod", option.value as CheckoutFormData["paymentMethod"])}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        form.paymentMethod === option.value
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {form.paymentMethod === "CARD" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Name on Card" value={form.cardName} onChange={(value) => updateField("cardName", value)} />
                    <Field label="Card Number" value={form.cardNumber} onChange={(value) => updateField("cardNumber", value)} placeholder="1234 5678 9012 3456" />
                    <Field label="Expiry" value={form.expiry} onChange={(value) => updateField("expiry", value)} placeholder="MM/YY" />
                    <Field label="CVV" value={form.cvv} onChange={(value) => updateField("cvv", value)} placeholder="123" />
                  </div>
                )}

                {form.paymentMethod === "UPI" && (
                  <div className="mt-5">
                    <Field label="UPI ID" value={form.upiId} onChange={(value) => updateField("upiId", value)} placeholder="name@bank" />
                  </div>
                )}

                {form.paymentMethod === "COD" && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Payment will be collected at the time of delivery. Order status will begin as processing.
                  </div>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] border border-white bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Order summary</h2>
              <div className="mt-5 space-y-4">
                {cart.items.map((item) => {
                  const product = productsMap[item.productId];
                  return (
                    <div key={item.productId} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                        {product?.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{product?.name ?? item.productId}</p>
                        <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        Rs {(product?.price ?? 0) * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">Rs {cart.totalPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryFee === 0 ? "Free" : `Rs ${deliveryFee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-semibold text-slate-900">Grand total</span>
                  <span className="font-bold text-indigo-600">Rs {grandTotal}</span>
                </div>
              </div>

              <button
                onClick={() => void handlePlaceOrder()}
                disabled={isSubmitting}
                className="mt-6 w-full rounded-full bg-indigo-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {isSubmitting ? "Placing Order..." : "Confirm Payment & Place Order"}
              </button>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
    </label>
  );
}
