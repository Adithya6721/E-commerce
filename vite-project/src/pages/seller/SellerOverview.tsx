import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProducts, type Product } from "../../services/productService";
import { getSellerOrders, type OrderRecord } from "../../services/orderService";
import { Package, TrendingUp, IndianRupee, Clock } from "lucide-react";

export default function SellerOverview() {
  const { username } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [allProds, myOrders] = await Promise.all([
          getProducts(),
          getSellerOrders(),
        ]);
        if (!cancelled) {
          setProducts(allProds.filter((p) => p.sellerId === username));
          setOrders(myOrders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (isLoading) {
    return <div className="p-8 text-slate-500">Loading your store analytics...</div>;
  }

  // Calculate metrics
  const activeProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const pendingOrders = orders.filter((o) => o.status === "PLACED" || o.status === "CONFIRMED").length;

  // Calculate total revenue from just their products
  let totalRevenue = 0;
  orders.forEach((order) => {
    if (order.status !== "CANCELLED") {
      order.items.forEach((item) => {
        if (item.sellerId === username) {
          totalRevenue += item.price * item.quantity;
        }
      });
    }
  });

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back! Here's how your store is doing.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`Rs ${totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Active Products"
          value={activeProducts.toString()}
          icon={Package}
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStock.toString()}
          icon={TrendingUp}
          color={outOfStock > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders.toString()}
          icon={Clock}
          color={pendingOrders > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}
        />
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recent Store Activity</h2>
        {orders.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No orders yet. Add some products to get started!</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 relative z-10" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
