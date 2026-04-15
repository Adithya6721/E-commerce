import { useEffect, useMemo, useState } from "react";
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
import { TrendingUp, Activity, RefreshCw } from "lucide-react";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

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

  useEffect(() => {
    void loadData();
  }, []);

  // Compute Revenue Timeline (Last 7 days)
  const timelineData = useMemo(() => {
    const today = new Date();
    const dataMap: Record<string, number> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      dataMap[dateStr] = 0;
    }

    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        const d = new Date(o.createdAt);
        const dateStr = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] += o.totalAmount;
        }
      }
    });

    return Object.entries(dataMap).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  // Compute Revenue by Category
  const categoryData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        o.items.forEach((item) => {
          const category = item.category || "Other";
          dataMap[category] = (dataMap[category] || 0) + item.price * item.quantity;
        });
      }
    });

    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const totalGMV = useMemo(() => orders.reduce((sum, o) => o.status !== "CANCELLED" ? sum + o.totalAmount : sum, 0), [orders]);

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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 flex items-center gap-6 shadow-sm">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Lifetime GMV</p>
            <p className="text-3xl font-bold text-slate-900">{formatMoney(totalGMV)}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 flex items-center gap-6 shadow-sm">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Transactions</p>
            <p className="text-3xl font-bold text-slate-900">{orders.filter(o => o.status !== "CANCELLED" && o.status !== "DELIVERED").length}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <AdminPanel title="Revenue Timeline (Last 7 Days)">
          <div className="h-80 mt-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Generating timeline...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs ${value.toLocaleString()}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, 'Revenue']}
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
              <p className="text-sm text-slate-500">Analyzing categories...</p>
            ) : categoryData.length === 0 ? (
              <p className="text-sm text-slate-500">No category data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!isLoading && categoryData.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-semibold text-slate-600">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </section>
    </div>
  );
}
