import { useEffect, useState } from "react";
import { PackageSearch, Calendar, IndianRupee } from "lucide-react";
import {
  AdminPageHeader,
  AdminPanel,
  formatApiError
} from "@/components/admin/AdminUi";
import { getAllOrders, type OrderRecord } from "@/services/orderService";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadGlobalOrders = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGlobalOrders();
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Global Orders"
        title="Platform Fulfillment Operations"
        description="Monitor every active and fulfilled order across all sellers. Admin has a read-only oversight view."
      />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Failed to load orders: {loadError}
        </div>
      )}

      <AdminPanel title="Latest Network Orders">
        {isLoading ? (
          <p className="text-sm text-slate-500">Gathering global transactions...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <PackageSearch className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No active orders</h3>
            <p className="text-sm text-slate-500">The platform hasn't processed any transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-400 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID / Date</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Fulfillment State</th>
                  <th className="px-6 py-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-slate-800">#{order.id.slice(-6).toUpperCase()}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">@{order.userId}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.shippingDetails.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "CANCELLED" ? "bg-rose-100 text-rose-700" :
                        "bg-sky-100 text-sky-700"
                      }`}>
                        {order.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                        {order.items.length} items from {new Set(order.items.map(i => i.sellerId)).size} sellers
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center font-bold text-slate-900">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {order.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{order.paymentMethod}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
