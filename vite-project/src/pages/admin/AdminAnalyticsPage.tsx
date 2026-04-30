import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatMoney, AdminPageHeader, AdminPanel } from "@/components/admin/AdminUi";
import { getAllOrders, type OrderRecord } from "@/services/orderService";
import { TrendingUp, Activity, ShoppingCart, RefreshCw, TrendingDown } from "lucide-react";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

// ─── Animated counter ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, label, value, rawValue, trend, trendLabel }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; value: string; rawValue: number;
  trend?: number; trendLabel?: string;
}) {
  const counted = useCountUp(rawValue);
  const displayValue = value.startsWith("Rs") ? `Rs ${counted.toLocaleString()}` : String(counted);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 flex items-center gap-6 shadow-sm">
      <div className={`p-4 ${iconBg} ${iconColor} rounded-2xl`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{displayValue}</p>
        {trend !== undefined && (
          <div className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  // Revenue Timeline (Last 7 days)
  const timelineData = useMemo(() => {
    const today = new Date();
    const dataMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      dataMap[d.toLocaleDateString("default", { month: "short", day: "numeric" })] = 0;
    }
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        const dateStr = new Date(o.createdAt).toLocaleDateString("default", { month: "short", day: "numeric" });
        if (dataMap[dateStr] !== undefined) dataMap[dateStr] += o.totalAmount;
      }
    });
    return Object.entries(dataMap).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  // Revenue by Category
  const categoryData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        o.items.forEach((item) => {
          const cat = item.category || "Other";
          dataMap[cat] = (dataMap[cat] || 0) + item.price * item.quantity;
        });
      }
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; units: number }> = {};
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        o.items.forEach((item) => {
          if (!map[item.productId]) map[item.productId] = { name: item.name, revenue: 0, units: 0 };
          map[item.productId].revenue += item.price * item.quantity;
          map[item.productId].units += item.quantity;
        });
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const totalGMV = useMemo(() => orders.reduce((sum, o) => o.status !== "CANCELLED" ? sum + o.totalAmount : sum, 0), [orders]);
  const activeTransactions = orders.filter(o => o.status !== "CANCELLED" && o.status !== "DELIVERED").length;
  const totalOrders = orders.filter(o => o.status !== "CANCELLED").length;

  // Trend: compare today vs yesterday revenue
  const todayRevenue = timelineData[timelineData.length - 1]?.revenue ?? 0;
  const yesterdayRevenue = timelineData[timelineData.length - 2]?.revenue ?? 0;
  const revTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : undefined;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Revenue & Performance"
        description="Monitor real gross merchandise value (GMV) based on finalized platform orders instead of shopping carts."
        action={
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Analytics
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard
          icon={<TrendingUp className="h-8 w-8" />}
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
          label="Total Lifetime GMV" value={`Rs ${totalGMV}`} rawValue={totalGMV}
          trend={revTrend} trendLabel="vs yesterday"
        />
        <KpiCard
          icon={<Activity className="h-8 w-8" />}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Active Transactions" value={String(activeTransactions)} rawValue={activeTransactions}
        />
        <KpiCard
          icon={<ShoppingCart className="h-8 w-8" />}
          iconBg="bg-sky-50" iconColor="text-sky-600"
          label="Total Orders" value={String(totalOrders)} rawValue={totalOrders}
        />
      </div>

      {/* Charts */}
      <section className="grid gap-8 lg:grid-cols-2">
        <AdminPanel title="Revenue Timeline (Last 7 Days)">
          <div className="h-80 mt-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={(v: any) => [`Rs ${Number(v).toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Revenue by Category">
          <div className="h-80 mt-4 flex items-center justify-center">
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            ) : categoryData.length === 0 ? (
              <p className="text-sm text-slate-500">No category data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((_e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={(v: any) => [`Rs ${Number(v).toLocaleString()}`, "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!isLoading && categoryData.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-semibold text-slate-600">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </section>

      {/* Top Products Table */}
      <AdminPanel title="Top Products by Revenue">
        {isLoading ? (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No order data available yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <th className="pb-3 text-left font-semibold pl-2">#</th>
                  <th className="pb-3 text-left font-semibold">Product</th>
                  <th className="pb-3 text-right font-semibold">Units Sold</th>
                  <th className="pb-3 text-right font-semibold pr-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topProducts.map((p, i) => {
                  const maxRev = topProducts[0].revenue;
                  const pct = (p.revenue / maxRev) * 100;
                  return (
                    <tr key={p.name} className="hover:bg-slate-50 transition-colors rounded-2xl">
                      <td className="py-3 pl-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-slate-100 text-slate-600" :
                          i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"
                        }`}>{i + 1}</span>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="mt-1 h-1.5 w-full max-w-[160px] rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold">{p.units}</td>
                      <td className="py-3 text-right font-bold text-slate-900 pr-2">{formatMoney(p.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
