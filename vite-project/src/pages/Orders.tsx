import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, type OrderRecord } from "../services/orderService";

const statusTone: Record<string, string> = {
  PLACED: "bg-violet-100 text-violet-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PACKED: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export default function Orders() {
  const { username } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getMyOrders();
        if (!cancelled) {
          setOrders(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load orders.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_40%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">My Orders</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Track your order history</h1>
        </div>

        {loadError && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                <div className="h-6 w-32 rounded bg-slate-100" />
                <div className="mt-3 h-8 w-48 rounded bg-slate-100" />
                <div className="mt-4 h-4 w-64 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Place an order from checkout and it will appear here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const currentStepIndex = STATUS_STEPS.indexOf(
                order.status as (typeof STATUS_STEPS)[number]
              );
              const isCancelled = order.status === "CANCELLED";

              return (
                <article key={order.id} className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{order.id}</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">
                        {new Date(order.createdAt).toLocaleString()}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Delivering to {order.shippingDetails.fullName}, {order.shippingDetails.city}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone[order.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {order.status.replaceAll("_", " ")}
                      </span>
                      <p className="mt-3 text-lg font-bold text-indigo-600">Rs {order.totalAmount}</p>
                    </div>
                  </div>

                  {/* Order tracking timeline */}
                  {!isCancelled && (
                    <div className="mt-6 flex items-center gap-0">
                      {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isActive = index === currentStepIndex;
                        return (
                          <div key={step} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                                  isActive
                                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                    : isCompleted
                                      ? "bg-emerald-500 text-white"
                                      : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {isCompleted && !isActive ? "✓" : index + 1}
                              </div>
                              <span className={`mt-2 text-[10px] font-medium uppercase tracking-wider ${
                                isCompleted ? "text-slate-900" : "text-slate-400"
                              }`}>
                                {step}
                              </span>
                            </div>
                            {index < STATUS_STEPS.length - 1 && (
                              <div className={`mx-1 h-0.5 flex-1 ${
                                index < currentStepIndex ? "bg-emerald-400" : "bg-slate-200"
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5 grid gap-3">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.category} • Qty {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
