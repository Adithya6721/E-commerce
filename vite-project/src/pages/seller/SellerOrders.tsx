import { useEffect, useState } from "react";
import { getSellerOrders, updateOrderStatus, type OrderRecord, type OrderStatus } from "../../services/orderService";

const ORDER_STEPS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default function SellerOrders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getSellerOrders();
      setOrders(data);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const currentIndex = ORDER_STEPS.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === ORDER_STEPS.length - 1) return;

    const nextStatus = ORDER_STEPS[currentIndex + 1];
    
    if (confirm(`Advance order #${orderId.slice(-6).toUpperCase()} to ${nextStatus}?`)) {
      try {
        await updateOrderStatus(orderId, nextStatus);
        void loadOrders();
      } catch (err) {
        alert("Failed to update status.");
      }
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading orders...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage fulfillment and track incoming orders.</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">No orders yet</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">When customers purchase your products, the orders will appear here for you to fulfill.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const nextStatus = ORDER_STEPS[ORDER_STEPS.indexOf(order.status) + 1];

            return (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</span>
                    <p className="font-mono text-sm font-semibold text-slate-800">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</span>
                    <p className="text-sm font-medium text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
                    <p className={`mt-0.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                      order.status === "CANCELLED" ? "bg-rose-100 text-rose-700" :
                      "bg-sky-100 text-sky-700"
                    }`}>
                      {order.status}
                    </p>
                  </div>
                  <div>
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && nextStatus && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Mark as {nextStatus}
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Items in Order</h3>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.productId} className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-semibold text-slate-900">Rs {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Shipping Details</h3>
                      <p className="text-sm font-semibold text-slate-900">{order.shippingDetails.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.shippingDetails.address}<br />
                        {order.shippingDetails.city}, {order.shippingDetails.pincode}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                        📞 {order.shippingDetails.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
