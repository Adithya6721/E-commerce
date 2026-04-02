import { useEffect, useState } from "react";
import { Boxes, RefreshCw, ShoppingCart, TrendingUp } from "lucide-react";
import {
  AdminMiniStat,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  formatApiError,
  formatMoney,
} from "@/components/admin/AdminUi";
import { getCartSummary, type CartSummary } from "@/services/cartService";
import { getProductSummary, type ProductSummary } from "@/services/productService";

export default function AdminAnalyticsPage() {
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [productData, cartData] = await Promise.all([
        getProductSummary(),
        getCartSummary(),
      ]);
      setProductSummary(productData);
      setCartSummary(cartData);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Track inventory and projected revenue"
        description="These figures currently come from inventory totals and active cart values. Once your app has orders, this page can be upgraded to true sales analytics."
        action={
          <button
            onClick={() => void loadAnalytics()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Analytics
          </button>
        }
      />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Analytics could not load backend data: {loadError}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Projected Revenue" value={cartSummary ? formatMoney(cartSummary.projectedRevenue) : "Unavailable"} detail="Sum of current cart totals" icon={<TrendingUp className="h-5 w-5" />} />
        <AdminStatCard title="Inventory Value" value={productSummary ? formatMoney(productSummary.totalInventoryValue) : "Unavailable"} detail="Catalog price x stock" icon={<Boxes className="h-5 w-5" />} />
        <AdminStatCard title="Carts With Items" value={cartSummary?.cartsWithItems ?? "Unavailable"} detail="Non-empty carts" icon={<ShoppingCart className="h-5 w-5" />} />
        <AdminStatCard title="Low Stock Products" value={productSummary?.lowStockProducts ?? "Unavailable"} detail="Items at or below threshold" icon={<Boxes className="h-5 w-5" />} />
      </section>

      <AdminPanel title="Metric Breakdown">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading analytics...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMiniStat label="Total Products" value={productSummary?.totalProducts ?? "Unavailable"} />
            <AdminMiniStat label="Units in Stock" value={productSummary?.totalUnitsInStock ?? "Unavailable"} />
            <AdminMiniStat label="Total Carts" value={cartSummary?.totalCarts ?? "Unavailable"} />
            <AdminMiniStat label="Items in Carts" value={cartSummary?.totalItemsInCarts ?? "Unavailable"} />
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
