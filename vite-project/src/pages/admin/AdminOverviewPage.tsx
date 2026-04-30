import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Shield, TrendingUp, Users, Lightbulb } from "lucide-react";
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

  const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= 5), [products]);

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

    if (productSummaryResult.status === "fulfilled") setProductSummary(productSummaryResult.value);
    if (userSummaryResult.status === "fulfilled") setUserSummary(userSummaryResult.value);
    if (cartSummaryResult.status === "fulfilled") setCartSummary(cartSummaryResult.value);
    if (productsResult.status === "fulfilled") setProducts(productsResult.value);

    setIsLoading(false);
  };

  useEffect(() => { void loadOverview(); }, []);

  // ── Live Quick Insights ──────────────────────────────────────────────────
  const insights = useMemo(() => {
    const tips: { text: string; tone: "info" | "warn" | "ok" }[] = [];

    if (productSummary) {
      if (productSummary.lowStockProducts > 0) {
        tips.push({ text: `${productSummary.lowStockProducts} product${productSummary.lowStockProducts > 1 ? "s are" : " is"} running low on stock — restock soon.`, tone: "warn" });
      } else {
        tips.push({ text: "All products are well-stocked. Inventory looks healthy!", tone: "ok" });
      }
      tips.push({ text: `Catalog has ${productSummary.totalProducts} product${productSummary.totalProducts !== 1 ? "s" : ""} with ${(productSummary.totalUnitsInStock ?? 0).toLocaleString()} total units in stock.`, tone: "info" });
    }

    if (userSummary) {
      tips.push({ text: `Platform has ${userSummary.totalUsers} registered users: ${userSummary.totalSellers} sellers and ${userSummary.totalCustomers} customers.`, tone: "info" });
      if (userSummary.totalSellers === 0) {
        tips.push({ text: "No sellers yet — approve seller applications in the Seller Apps section.", tone: "warn" });
      }
    }

    if (cartSummary) {
      tips.push({ text: `${cartSummary.cartsWithItems} active cart${cartSummary.cartsWithItems !== 1 ? "s" : ""} with projected revenue of ${formatMoney(cartSummary.projectedRevenue)}.`, tone: cartSummary.projectedRevenue > 0 ? "ok" : "info" });
    }

    const failedApis = statuses.filter(s => !s.ok);
    if (failedApis.length > 0) {
      tips.push({ text: `${failedApis.length} backend service${failedApis.length > 1 ? "s are" : " is"} unreachable: ${failedApis.map(s => s.label).join(", ")}.`, tone: "warn" });
    } else if (statuses.length > 0) {
      tips.push({ text: "All backend services are online and responding correctly.", tone: "ok" });
    }

    return tips;
  }, [productSummary, userSummary, cartSummary, cartSummary, statuses]);

  const toneStyles = {
    info: "bg-sky-50 border-sky-100 text-sky-800",
    warn: "bg-amber-50 border-amber-100 text-amber-800",
    ok:   "bg-emerald-50 border-emerald-100 text-emerald-800",
  };
  const toneIcons = { info: "ℹ️", warn: "⚠️", ok: "✅" };

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
            <div className="space-y-3 mt-1">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No low-stock items were returned by the backend.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 border border-amber-100">
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

        {/* Live Quick Insights — replaces dead "Analytics Notes" */}
        <AdminPanel title="Quick Insights">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-500 font-medium">Generated from live backend data</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : insights.length === 0 ? (
            <p className="text-sm text-slate-500">Insights will appear once backend data loads.</p>
          ) : (
            <div className="space-y-3">
              {insights.map((tip, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${toneStyles[tip.tone]}`}>
                  <span className="text-base leading-none mt-0.5">{toneIcons[tip.tone]}</span>
                  <span className="leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </section>
    </div>
  );
}

function createStatus<T>(label: string, endpoint: string, result: PromiseSettledResult<T>, successDetail: string): ApiStatus {
  if (result.status === "fulfilled") return { label, endpoint, ok: true, detail: successDetail };
  return { label, endpoint, ok: false, detail: formatApiError(result.reason) };
}
