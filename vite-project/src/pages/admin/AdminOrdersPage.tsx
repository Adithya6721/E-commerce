import { useEffect, useState } from "react";
import { PackageSearch, Calendar, IndianRupee, Info } from "lucide-react";
import {
  AdminPageHeader,
  AdminPanel,
  formatApiError
} from "@/components/admin/AdminUi";
import { getAllOrders, type OrderRecord } from "@/services/orderService";

const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "ord-demo-a1b2c3d4e5f6",
    userId: "customer_ravi",
    items: [
      { productId: "p1", name: "Premium Wireless Headphones", price: 2499, quantity: 1, image: "", category: "Electronics", sellerId: "seller_anita" },
      { productId: "p2", name: "Organic Cotton T-Shirt", price: 899, quantity: 2, image: "", category: "Fashion", sellerId: "seller_priya" },
    ],
    totalAmount: 4297,
    status: "SHIPPED",
    paymentMethod: "UPI",
    shippingDetails: { fullName: "Ravi Kumar", phone: "9876543210", address: "123 MG Road", city: "Bangalore", pincode: "560001" },
    statusHistory: [{ status: "PLACED", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), changedBy: "system" }],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  {
    id: "ord-demo-f6e5d4c3b2a1",
    userId: "customer_meera",
    items: [
      { productId: "p3", name: "Smart Fitness Watch", price: 3499, quantity: 1, image: "", category: "Electronics", sellerId: "seller_anita" },
    ],
    totalAmount: 3499,
    status: "DELIVERED",
    paymentMethod: "COD",
    shippingDetails: { fullName: "Meera Patel", phone: "9988776655", address: "45 Lake View Apt", city: "Mumbai", pincode: "400001" },
    statusHistory: [{ status: "PLACED", timestamp: new Date(Date.now() - 7 * 86400000).toISOString(), changedBy: "system" }],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ord-demo-1a2b3c4d5e6f",
    userId: "customer_arjun",
    items: [
      { productId: "p4", name: "Artisan Coffee Beans (500g)", price: 649, quantity: 3, image: "", category: "Food & Beverages", sellerId: "seller_vikram" },
      { productId: "p5", name: "Ceramic Plant Pot Set", price: 1199, quantity: 1, image: "", category: "Home & Garden", sellerId: "seller_priya" },
    ],
    totalAmount: 3146,
    status: "CONFIRMED",
    paymentMethod: "Card",
    shippingDetails: { fullName: "Arjun Singh", phone: "9123456780", address: "78 Green Park", city: "Delhi", pincode: "110001" },
    statusHistory: [{ status: "PLACED", timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), changedBy: "system" }],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  {
    id: "ord-demo-6f5e4d3c2b1a",
    userId: "customer_divya",
    items: [
      { productId: "p6", name: "Yoga Mat Premium", price: 1499, quantity: 1, image: "", category: "Sports", sellerId: "seller_vikram" },
      { productId: "p7", name: "Bluetooth Portable Speaker", price: 1799, quantity: 1, image: "", category: "Electronics", sellerId: "seller_anita" },
    ],
    totalAmount: 3298,
    status: "PLACED",
    paymentMethod: "UPI",
    shippingDetails: { fullName: "Divya Sharma", phone: "9876012345", address: "12 Jubilee Hills", city: "Hyderabad", pincode: "500033" },
    statusHistory: [{ status: "PLACED", timestamp: new Date(Date.now() - 0.5 * 86400000).toISOString(), changedBy: "system" }],
    createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 6 * 86400000).toISOString(),
  },
  {
    id: "ord-demo-ab12cd34ef56",
    userId: "customer_ravi",
    items: [
      { productId: "p8", name: "Leather Messenger Bag", price: 4299, quantity: 1, image: "", category: "Fashion", sellerId: "seller_priya" },
    ],
    totalAmount: 4299,
    status: "CANCELLED",
    paymentMethod: "Card",
    shippingDetails: { fullName: "Ravi Kumar", phone: "9876543210", address: "123 MG Road", city: "Bangalore", pincode: "560001" },
    statusHistory: [{ status: "PLACED", timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), changedBy: "system" }],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const loadGlobalOrders = async () => {
    setIsLoading(true);
    setLoadError(null);
    setIsUsingMock(false);
    try {
      const data = await getAllOrders();
      if (data.length === 0) {
        setOrders(MOCK_ORDERS);
        setIsUsingMock(true);
      } else {
        setOrders(data);
      }
    } catch (error) {
      console.warn("Order API unavailable, using demo data:", error);
      setOrders(MOCK_ORDERS);
      setIsUsingMock(true);
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

      {isUsingMock && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <Info className="h-4 w-4 flex-shrink-0" />
          {loadError
            ? `Backend unavailable (${loadError}). Showing demo data to preview UI layout.`
            : "No orders in the database yet. Showing demo data to preview UI layout."}
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
