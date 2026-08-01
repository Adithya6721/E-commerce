import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getProducts, type Product } from "../../services/productService";
import { getSellerOrders, type OrderRecord } from "../../services/orderService";
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const cardHover = { y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.10)" };
const cardTap   = { scale: 0.985 };
const cardTrans = { duration: 0.25, ease: "easeOut" } as any;
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay, ease: "easeOut" } as any });

// ─── Animated Counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
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

// Old SVG chart components removed — replaced by Recharts (AreaChart, RechartsBarChart)

const AnimatedDonut = ({ value, color = "#3b82f6" }: { value: number; color?: string }) => {
  const r = 36, cx = 44, cy = 44, stroke = 10;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setDash((value / 100) * circ), 80);
    return () => clearTimeout(timer);
  }, [value, circ]);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
        {Math.round(value)}%
      </text>
    </svg>
  );
};

const AnimatedGauge = ({ value }: { value: number }) => {
  const r = 36, stroke = 10;
  const circ = Math.PI * r;
  const [dash, setDash] = useState(0);
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";
  useEffect(() => {
    const timer = setTimeout(() => setDash((value / 100) * circ), 80);
    return () => clearTimeout(timer);
  }, [value, circ]);
  return (
    <svg width="88" height="52" viewBox="0 0 88 52">
      <path d={`M8,44 A${r},${r} 0 0,1 80,44`} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M8,44 A${r},${r} 0 0,1 80,44`} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={44} y={44} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>
        {Math.round(value)}%
      </text>
    </svg>
  );
};

// ─── Stat Card with animated counter ─────────────────────────────────────────
function StatCard({ icon, rawValue, label, sub, color: _color, bg }: {
  icon: string; rawValue: number; label: string; sub: string; color: string; bg: string;
}) {
  const counted = useCountUp(rawValue);
  return (
    <motion.div
      whileHover={cardHover} whileTap={cardTap} transition={cardTrans}
      style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", border: "1px solid rgba(226,232,240,0.7)", borderRadius: 20, padding: "18px 22px", flex: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", cursor: "default" }}
    >
      <motion.div
        whileHover={{ scale: 1.18, rotate: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}
      >{icon}</motion.div>
      <div>
        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 17 }}>{label.startsWith("Rs") ? `Rs ${counted.toLocaleString()}` : `${counted}${label}`}</div>
        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{sub}</div>
      </div>
    </motion.div>
  );
}

type Period = 7 | 15 | 30;

export default function SellerOverview() {
  const { username } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(15);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [allProds, myOrders] = await Promise.all([getProducts(), getSellerOrders()]);
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
    return () => { cancelled = true; };
  }, [username]);

  if (isLoading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
          ))}
        </div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  const activeProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const days = Array.from({ length: period }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (period - 1 - i));
    return d.toISOString().split("T")[0];
  });

  const salesByDay = new Map<string, number>(days.map(d => [d, 0]));
  const ordersByDay = new Map<string, number>(days.map(d => [d, 0]));

  let totalRevenue = 0, totalItemsSold = 0, completedItems = 0, pendingItems = 0;
  const recentSales: any[] = [];

  orders.forEach((order) => {
    const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
    let dailyRev = 0;
    order.items.forEach((item) => {
      if (item.sellerId === username) {
        recentSales.push({
          product: item.name,
          customer: order.shippingDetails.fullName,
          rating: 5,
          review: `Ordered ${item.quantity} units for Rs ${item.price * item.quantity}.`,
          status: item.itemStatus || order.status,
          time: new Date(order.createdAt).toLocaleDateString(),
          avatar: order.shippingDetails.fullName.charAt(0).toUpperCase(),
          avatarColor: "#" + (((order.shippingDetails.fullName.charCodeAt(0) * 2654435761) >>> 0) % 0xffffff).toString(16).padStart(6, "0"),
        });
        if (item.itemStatus === "DELIVERED") {
          totalRevenue += item.price * item.quantity;
          dailyRev += item.price * item.quantity;
          completedItems++;
        } else if (!item.itemStatus?.includes("CANCELLED") && !item.itemStatus?.includes("RETURN")) {
          pendingItems++;
        }
        totalItemsSold++;
      }
    });
    if (salesByDay.has(dateStr)) {
      salesByDay.set(dateStr, salesByDay.get(dateStr)! + dailyRev);
      ordersByDay.set(dateStr, ordersByDay.get(dateStr)! + 1);
    }
  });

  const rawSalesData = Array.from(salesByDay.values());
  const rawOrdersData = Array.from(ordersByDay.values());
  const isSampleData = rawSalesData.every(x => x === 0);

  // Fallback sample data scaled by period
  const SAMPLE_BASE = [30, 60, 45, 80, 55, 95, 70, 110, 85, 130, 95, 150, 110, 160, 140, 175, 120, 190, 145, 210, 135, 220, 155, 230, 170, 245, 185, 260, 200, 270];
  const chartSalesData = isSampleData ? SAMPLE_BASE.slice(0, period) : rawSalesData;
  const chartOrdersData = rawOrdersData.every(x => x === 0)
    ? [4, 7, 5, 9, 6, 11, 8, 14, 9, 16, 11, 13, 10, 12, 16, 8, 11, 13, 15, 18, 12, 14, 17, 9, 12, 15, 16, 11, 14, 18].slice(0, period)
    : rawOrdersData;

  const inStockPct = activeProducts > 0 ? ((activeProducts - outOfStock) / activeProducts) * 100 : 0;
  const fulfillPct = totalItemsSold > 0 ? (completedItems / totalItemsSold) * 100 : 0;
  const payPct = (completedItems + pendingItems) > 0 ? (completedItems / (completedItems + pendingItems)) * 100 : 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", color: "#1e293b", fontSize: 13 }} className="gradient-mesh">
      <main style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Page Header */}
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', system-ui" }}>Seller Analytics</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Here's what's going on at your business right now</div>
        </div>

        {/* KPI Cards */}
        <motion.div {...fadeUp(0.05)} style={{ display: "flex", gap: 16 }}>
          <StatCard icon="💰" rawValue={totalRevenue} label="Rs " sub="Total Revenue Generated" color="#3b82f6" bg="#eff6ff" />
          <StatCard icon="📦" rawValue={pendingItems} label=" pending items" sub="Awaiting processing" color="#f59e0b" bg="#fffbeb" />
          <StatCard icon="⚠️" rawValue={outOfStock} label=" out of stock" sub="Products need restocking" color="#ef4444" bg="#fef2f2" />
        </motion.div>

        {/* Revenue Chart + Orders Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>

          {/* Revenue Chart */}
          <motion.div {...fadeUp(0.12)} whileHover={cardHover} transition={cardTrans} style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(226,232,240,0.7)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Total Revenue Overview</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Payment received across all your items</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isSampleData && (
                  <span style={{ fontSize: 10, fontWeight: 600, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", borderRadius: 99, padding: "3px 8px", letterSpacing: "0.04em" }}>
                    SAMPLE DATA
                  </span>
                )}
                <select
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value) as Period)}
                  style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#64748b", cursor: "pointer", outline: "none", background: "#fff" }}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={15}>Last 15 Days</option>
                  <option value={30}>Last 30 Days</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 24, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days.map((d, i) => ({ date: d.slice(5), revenue: chartSalesData[i] }))}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Total Units Sold Bar */}
          <motion.div {...fadeUp(0.18)} whileHover={cardHover} transition={cardTrans} style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(226,232,240,0.7)", padding: 20, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Total Units Sold</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700 }}>{totalItemsSold}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Across all products</div>
            </div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartOrdersData.map((v, i) => ({ day: i + 1, orders: v }))}>
                  <Bar dataKey="orders" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, background: "#1d4ed8", borderRadius: 3 }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Completed</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.round(fulfillPct)}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, background: "#93c5fd", borderRadius: 3 }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Pending</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.round(100 - fulfillPct)}%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Inventory Health + Fulfillment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Inventory Donut */}
          <motion.div {...fadeUp(0.22)} whileHover={cardHover} transition={cardTrans} style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(226,232,240,0.7)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Inventory Health</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16, marginTop: 4 }}>Current stock distribution</div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <AnimatedDonut value={inStockPct} color="#3b82f6" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Active & In-Stock", value: activeProducts - outOfStock, color: "#3b82f6" },
                  { label: "Out of Stock", value: outOfStock, color: "#f87171" },
                  { label: "Total Products listed", value: activeProducts, color: "#dbeafe" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                      <span style={{ fontSize: 13, color: "#64748b" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Fulfillment Gauge */}
          <motion.div {...fadeUp(0.27)} whileHover={cardHover} transition={cardTrans} style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(226,232,240,0.7)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Order Fulfillment</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16, marginTop: 4 }}>Overall platform tracking</div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <AnimatedGauge value={payPct} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Fulfilled Items", value: `${Math.round(payPct)}%`, color: payPct >= 70 ? "#10b981" : payPct >= 40 ? "#f59e0b" : "#ef4444" },
                  { label: "Pending Processing", value: `${Math.round(100 - payPct)}%`, color: "#e2e8f0" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                      <span style={{ fontSize: 13, color: "#64748b" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                {totalItemsSold === 0 && (
                  <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>No orders yet — make your first sale!</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Latest Sales Table */}
        <motion.div {...fadeUp(0.32)} whileHover={{ boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }} transition={cardTrans} style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(226,232,240,0.7)", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Latest Item Sales</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Your most recent successfully placed orders</div>
            </div>
            {recentSales.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 99, padding: "4px 12px" }}>
                {recentSales.length} item{recentSales.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  {["PRODUCT ↕", "CUSTOMER ↕", "RATING ↕", "ORDER INFO ↕", "STATUS ↕", "DATE ↕"].map((h) => (
                    <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.slice(-5).reverse().map((r, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 } as any}
                    whileHover={{ backgroundColor: "#f8faff" }}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "14px 12px", fontSize: 13, color: "#0f172a", maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{r.product}</div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: r.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{r.avatar}</div>
                        <span style={{ fontSize: 13, whiteSpace: "nowrap", fontWeight: 500 }}>{r.customer}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ color: s <= r.rating ? "#f59e0b" : "#e2e8f0", fontSize: 14 }}>★</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: 13, color: "#64748b", maxWidth: 220 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.review}</div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: (r.status === "DELIVERED" || r.status === "APPROVED") ? "#f0fdf4" : "CANCELLED" === r.status ? "#fef2f2" : "#fff7ed",
                        color: (r.status === "DELIVERED" || r.status === "APPROVED") ? "#10b981" : "CANCELLED" === r.status ? "#ef4444" : "#f97316",
                        border: `1px solid ${(r.status === "DELIVERED" || r.status === "APPROVED") ? "#bbf7d0" : "CANCELLED" === r.status ? "#fecaca" : "#fed7aa"}`,
                      }}>
                        {(r.status === "DELIVERED" || r.status === "APPROVED") ? "✓ " : ""}{r.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{r.time}</td>
                  </motion.tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No recent sales yet. Upload some products to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
