import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSellerOrders, updateOrderItemStatus, type OrderRecord, type OrderStatus } from "../../services/orderService";

const ORDER_STEPS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default function SellerOrders() {
  const { username } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shippingModal, setShippingModal] = useState<{orderId: string, productId: string} | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");

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
  }, [username]);

  const handleUpdateItemStatus = async (orderId: string, productId: string, currentStatus: OrderStatus) => {
    const currentIndex = ORDER_STEPS.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === ORDER_STEPS.length - 1) return;

    const nextStatus = ORDER_STEPS[currentIndex + 1];
    
    if (nextStatus === "SHIPPED") {
      setShippingModal({ orderId, productId });
      return;
    }
    
    if (confirm(`Advance item to ${nextStatus}?`)) {
      try {
        await updateOrderItemStatus(orderId, productId, nextStatus);
        void loadOrders();
      } catch (err) {
        alert("Failed to update status.");
      }
    }
  };

  const submitShippingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModal) return;
    
    try {
      await updateOrderItemStatus(
        shippingModal.orderId, 
        shippingModal.productId, 
        "SHIPPED", 
        trackingId, 
        courierName
      );
      setShippingModal(null);
      setTrackingId("");
      setCourierName("");
      void loadOrders();
    } catch (err) {
      alert("Failed to submit shipping details.");
    }
  };

  const handleReturnAction = async (orderId: string, productId: string, action: "RETURN_APPROVED" | "RETURN_REJECTED") => {
    if (confirm(`Are you sure you want to ${action === "RETURN_APPROVED" ? "approve" : "reject"} this return?`)) {
      try {
        await updateOrderItemStatus(orderId, productId, action);
        void loadOrders();
      } catch (err) {
        alert("Failed to process return.");
      }
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading orders...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage fulfillment and track incoming orders per item.</p>
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
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">When customers purchase your products, the items will appear here for you to fulfill.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            // Filter only the items belonging to this seller
            const sellerItems = order.items.filter(item => item.sellerId === username);
            if (sellerItems.length === 0) return null;

            return (
              <article key={order.id} className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</span>
                    <p className="font-mono text-sm font-semibold text-slate-800">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</span>
                    <p className="text-sm font-medium text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-1 max-w-xs ml-auto">
                    <div className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Deliver To</p>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{order.shippingDetails.fullName}</p>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {order.shippingDetails.address}, {order.shippingDetails.city}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Items to Fulfill</h3>
                  <div className="space-y-4">
                    {sellerItems.map((item) => {
                      const status = item.itemStatus || "PLACED";
                      const nextStatus = ORDER_STEPS[ORDER_STEPS.indexOf(status) + 1];

                      return (
                        <div key={item.productId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-indigo-100 transition">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 pr-4">
                              <p className="text-base font-semibold text-slate-900 truncate">{item.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm font-medium text-slate-500">Qty: {item.quantity}</span>
                                <span className="text-sm font-bold text-slate-900">Rs {item.price * item.quantity}</span>
                              </div>
                              {item.trackingId && (
                                <p className="text-xs text-indigo-600 font-medium mt-1">
                                  Shipped via {item.courierName} • Tracking: {item.trackingId}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 pl-4 md:border-l border-slate-100">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                              <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                                status === "RETURN_REQUESTED" ? "bg-amber-100 text-amber-700" :
                                status === "RETURN_APPROVED" ? "bg-rose-100 text-rose-700" :
                                "bg-sky-100 text-sky-700"
                              }`}>
                                {status.replace("_", " ")}
                              </span>
                            </div>

                            {status === "RETURN_REQUESTED" ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleReturnAction(order.id, item.productId, "RETURN_APPROVED")}
                                  className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                                >
                                  Approve Return
                                </button>
                                <button
                                  onClick={() => handleReturnAction(order.id, item.productId, "RETURN_REJECTED")}
                                  className="whitespace-nowrap rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                                >
                                  Reject Return
                                </button>
                              </div>
                            ) : (
                              status !== "DELIVERED" && status !== "CANCELLED" && !status.includes("RETURN") && nextStatus && (
                                <button
                                  onClick={() => handleUpdateItemStatus(order.id, item.productId, status)}
                                  className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                                >
                                  Mark as {nextStatus}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Shipping Modal */}
      {shippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Ship Item</h2>
              <p className="text-sm text-slate-500 mt-1">Provide tracking details for the customer.</p>
            </div>
            <form onSubmit={submitShippingDetails} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Courier Name</label>
                <input
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                  placeholder="E.g. BlueDart, FedEx"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tracking Number</label>
                <input
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                  placeholder="AWB / Tracking ID"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShippingModal(null)}
                  className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Ship Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
