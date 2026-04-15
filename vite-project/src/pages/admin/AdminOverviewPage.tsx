import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Shield, TrendingUp, Users } from "lucide-react";
import { DemoHeroGeometric } from "@/components/ui/demo";
import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  StatusList,
  formatApiError,
  formatMoney,
  type ApiStatus,
} from "@/components/admin/AdminUi";
import { getProductSummary, getProducts, type Product, type ProductSummary } from "@/services/productService";
import { getUserSummary, type UserSummary } from "@/services/userService";
import { getCartSummary, type CartSummary } from "@/services/cartService";

export default function AdminOverviewPage() {
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 5), [products]);

  const loadOverview = async () => {
    setIsLoading(true);
    const results = await Promise.allSettled([
      getProductSummary(),
      getUserSummary(),
      getCartSummary(),
      getProducts(),
    ]);

    const [productSummaryResult, userSummaryResult, cartSummaryResult, productsResult] = results;

    setStatuses([
      createStatus("Products API", "/products/admin/summary", productSummaryResult, "Summary fetched."),
      createStatus("Users API", "/users/summary", userSummaryResult, "Summary fetched."),
      createStatus("Cart Analytics API", "/cart/admin/summary", cartSummaryResult, "Summary fetched."),
      createStatus("Catalog API", "/products", productsResult, "Products fetched."),
    ]);

    if (productSummaryResult.status === "fulfilled") {
      setProductSummary(productSummaryResult.value);
    }
    if (userSummaryResult.status === "fulfilled") {
      setUserSummary(userSummaryResult.value);
    }
    if (cartSummaryResult.status === "fulfilled") {
      setCartSummary(cartSummaryResult.value);
    }
    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2.5rem]">
        <DemoHeroGeometric />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      <AdminPageHeader
        eyebrow="Admin Overview"
        title="Monitor your store at a glance"
        description="These cards reflect live backend responses. If a service fails, the status panel below will tell you exactly which endpoint is failing."
        action={
          <button
            onClick={() => void loadOverview()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Overview
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Products" value={productSummary?.totalProducts ?? "Unavailable"} detail="Catalog items live" icon={<Plus className="h-5 w-5" />} />
        <AdminStatCard title="Users" value={userSummary?.totalUsers ?? "Unavailable"} detail={userSummary ? `${userSummary.totalAdmins} admins, ${userSummary.totalSellers} sellers, ${userSummary.totalCustomers} customers` : "Users API unavailable"} icon={<Users className="h-5 w-5" />} />
        <AdminStatCard title="Stock Units" value={productSummary?.totalUnitsInStock ?? "Unavailable"} detail={productSummary ? `${productSummary.lowStockProducts} low-stock products` : "Inventory summary unavailable"} icon={<Shield className="h-5 w-5" />} />
        <AdminStatCard title="Projected Revenue" value={cartSummary ? formatMoney(cartSummary.projectedRevenue) : "Unavailable"} detail={cartSummary ? `${cartSummary.cartsWithItems} active carts` : "Cart analytics unavailable"} icon={<TrendingUp className="h-5 w-5" />} />
      </section>

      <AdminPanel title="Backend Status">
        <StatusList statuses={statuses} />
      </AdminPanel>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel title="Low Stock Watchlist">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading inventory snapshot...</p>
          ) : lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No low-stock items were returned by the backend.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-amber-900">{product.name}</p>
                    <p className="text-sm text-amber-700">{product.stock} units left</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Low stock
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Analytics Notes">
          <div className="space-y-4 text-sm text-slate-600">
            <p>Revenue is currently projected from active carts because the app does not yet have a completed orders pipeline.</p>
            <p>If the cards above show zeros unexpectedly, check the backend status panel first. It now tells you whether each admin endpoint responded successfully.</p>
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

function createStatus<T>(
  label: string,
  endpoint: string,
  result: PromiseSettledResult<T>,
  successDetail: string
): ApiStatus {
  if (result.status === "fulfilled") {
    return { label, endpoint, ok: true, detail: successDetail };
  }

  return {
    label,
    endpoint,
    ok: false,
    detail: formatApiError(result.reason),
  };
}
