import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getOrderById } from "../services/orderService";

const statusTone: Record<string, string> = {
  PROCESSING: "bg-amber-100 text-amber-800",
  DISPATCHED: "bg-sky-100 text-sky-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
};

export default function OrderConfirmation() {
  const { orderId = "" } = useParams();
  const order = getOrderById(orderId);

  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfdf5_0%,#ffffff_40%,#f8fafc_100%)]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-[0_30px_80px_rgba(16,185,129,0.12)]">
          <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Order Confirmed
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-slate-900">
            Payment received. Your order is now being prepared.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">
            This confirmation is handled in the frontend for now. Once the orders backend is added, the same screen can be backed by real persisted order data.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard label="Order ID" value={order.id} />
            <InfoCard label="Status" value={order.status.replaceAll("_", " ")} tone={statusTone[order.status]} />
            <InfoCard label="Total Paid" value={`Rs ${order.totalAmount}`} />
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Delivery details</h2>
            <p className="mt-3 text-sm text-slate-600">
              {order.shippingDetails.fullName} • {order.shippingDetails.phone}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {order.shippingDetails.address}, {order.shippingDetails.city} - {order.shippingDetails.pincode}
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3">
        {tone ? (
          <span className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>
            {value}
          </span>
        ) : (
          <p className="text-lg font-semibold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
