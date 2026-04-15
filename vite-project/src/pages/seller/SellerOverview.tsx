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

  // Calculate stock alerts (<= 5)
  const stockAlerts = products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  // Calculate top selling products
  const productSales: Record<string, { name: string; quantitySold: number; revenue: number; image: string }> = {};
  
  // Calculate total revenue from just their products based on itemStatus
  let totalRevenue = 0;
  let pendingItemOrders = 0;

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.sellerId === username) {
        // Only count DELIVERED items for revenue
        if (item.itemStatus === "DELIVERED") {
          totalRevenue += item.price * item.quantity;
        }
        
        // Count pending internal items
        if (!item.itemStatus || item.itemStatus === "PLACED" || item.itemStatus === "CONFIRMED" || item.itemStatus === "PACKED") {
          pendingItemOrders++;
        }

        // Only count non-cancelled sales
        if (item.itemStatus !== "CANCELLED" && !item.itemStatus?.includes("RETURN_")) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.name,
              quantitySold: 0,
              revenue: 0,
              image: item.image,
            };
          }
          productSales[item.productId].quantitySold += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        }
      }
    });
  });

  const topSelling = Object.values(productSales)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Command Center</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back! Analyze your store performance and manage alerts.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completed Revenue"
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
          title="Items to Fulfill"
          value={pendingItemOrders.toString()}
          icon={Clock}
          color={pendingItemOrders > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Top Selling Products</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">By Volume</span>
          </div>
          
          {topSelling.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <p className="text-sm text-slate-500">Not enough data to calculate top products.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSelling.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-xs text-slate-500">{prod.quantitySold} units sold</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600">Rs {prod.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Inventory Alerts</h2>
            {stockAlerts.length > 0 && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                {stockAlerts.length} Action Required
              </span>
            )}
          </div>
          
          {stockAlerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 py-10 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-emerald-700">All products are healthy!</p>
              <p className="text-xs text-emerald-600 mt-1">No low stock alerts at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[300px]">
              {stockAlerts.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-xs text-slate-500 mt-1">ID: {prod.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xl font-black text-rose-600">{prod.stock}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Units Left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
