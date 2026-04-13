import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getOrdersByUser } from "../services/orderService";

const statusTone: Record<string, string> = {
  PROCESSING: "bg-amber-100 text-amber-800",
  DISPATCHED: "bg-sky-100 text-sky-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
};

export default function Orders() {
  const { username } = useAuth();
  const orders = getOrdersByUser(username || "");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_40%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-indigo-500">My Orders</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Track your order history</h1>
          <p className="mt-2 text-sm text-slate-500">
            These orders are currently stored on the frontend until the orders database is connected.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Place an order from checkout and it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
