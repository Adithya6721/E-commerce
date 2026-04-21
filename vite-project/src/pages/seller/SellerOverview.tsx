import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProducts, type Product } from "../../services/productService";
import { getSellerOrders, type OrderRecord } from "../../services/orderService";

// ----------------------------------------------------
// Chart Components (Adapted from template)
// ----------------------------------------------------
const LineChart = ({ data, color = "#3b82f6", height = 60, fill = false }: any) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = data.map((v: number, i: number) => [
    (i / (data.length - 1 || 1)) * w,
    h - ((v - min) / range) * (h - 8) - 4,
  ]);
  const path = pts.map((p: any, i: number) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const fillPath = fill ? `${path} L${w},${h} L0,${h} Z` : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      {fill && (
        <defs>
          <linearGradient id={`g-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={fillPath!} fill={`url(#g-${color.replace("#", "")})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const BarChart = ({ data, color = "#3b82f6" }: any) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 50 }}>
      {data.map((v: number, i: number) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 2 ? "#1d4ed8" : color,
            height: `${(v / max) * 100}%`,
            borderRadius: "2px 2px 0 0",
            opacity: 0.7 + (v / max) * 0.3,
          }}
        />
      ))}
    </div>
  );
};

const DonutChart = ({ value, color = "#3b82f6" }: any) => {
  const r = 36, cx = 44, cy = 44, stroke = 10;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">{Math.round(value)}%</text>
    </svg>
  );
};

const GaugeChart = ({ value }: any) => {
  const r = 36, cx = 44, cy = 44, stroke = 10;
  const circ = Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="88" height="52" viewBox="0 0 88 52">
      <path d={`M8,44 A${r},${r} 0 0,1 80,44`} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M8,44 A${r},${r} 0 0,1 80,44`} fill="none" stroke="#3b82f6" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x={44} y={44} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">{Math.round(value)}%</text>
    </svg>
  );
};

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

  // ----------------------------------------------------
  // Dynamic Data Processing
  // ----------------------------------------------------

  // 1. Calculate general metrics
  const activeProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  // 2. Aggregate orders and revenue over the last 15 days
  const last15Days = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return d.toISOString().split("T")[0];
  });
  
  const salesByDay = new Map<string, number>(last15Days.map(d => [d, 0]));
  const ordersByDay = new Map<string, number>(last15Days.map(d => [d, 0]));

  let totalRevenue = 0;
  let totalItemsSold = 0;
  let completedItems = 0;
  let pendingItems = 0;
  
  // Track metrics for reviews table replacement (Recent Orders)
  const recentSales: any[] = [];

  orders.forEach((order) => {
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toISOString().split("T")[0];
    let dailyRevenueAdd = 0;
    
    order.items.forEach((item) => {
      if (item.sellerId === username) {
        // Collect Recent Sales
        recentSales.push({
          product: item.name,
          customer: order.shippingDetails.fullName,
          rating: 5, // Placeholder for look and feel
          review: `Ordered ${item.quantity} units for Rs ${item.price * item.quantity}.`,
          status: item.itemStatus || order.status,
          time: new Date(order.createdAt).toLocaleDateString(),
          avatar: order.shippingDetails.fullName.charAt(0).toUpperCase(),
          avatarColor: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
        });

        if (item.itemStatus === "DELIVERED") {
          totalRevenue += item.price * item.quantity;
          dailyRevenueAdd += item.price * item.quantity;
          completedItems++;
        } else if (!item.itemStatus?.includes("CANCELLED") && !item.itemStatus?.includes("RETURN")) {
          pendingItems++;
        }
        totalItemsSold++;
      }
    });

    if (salesByDay.has(dateStr)) {
      salesByDay.set(dateStr, salesByDay.get(dateStr)! + dailyRevenueAdd);
      ordersByDay.set(dateStr, ordersByDay.get(dateStr)! + 1);
    }
  });

  const totalSalesData = Array.from(salesByDay.values());
  const ordersBarData = Array.from(ordersByDay.values());
  
  // Provide realistic fallback data if brand new account with 0 sales
  const chartSalesData = totalSalesData.every(x => x === 0) ? [30, 60, 45, 80, 55, 95, 70, 110, 85, 130, 95, 150, 110, 160, 140] : totalSalesData;
  const chartOrdersData = ordersBarData.every(x => x === 0) ? [4, 7, 5, 9, 6, 11, 8, 14, 9, 16, 11, 13, 10, 12, 16] : ordersBarData;

  const deliveredPercentage = totalItemsSold > 0 ? (completedItems / totalItemsSold) * 100 : 0;
  const payingCustomerPercentage = totalItemsSold > 0 ? (completedItems / (completedItems + pendingItems)) * 100 || 30 : 30;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8fafc", color: "#1e293b", fontSize: 13, height: "100%" }}>
      {/* Content */}
      <main style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Page Header */}
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Seller Analytics</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Here's what's going on at your business right now</div>
        </div>

        {/* Alert Cards Row */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { icon: "💰", count: `Rs ${totalRevenue.toLocaleString()}`, sub: "Total Revenue Generated", color: "#3b82f6", bg: "#eff6ff" },
            { icon: "📦", count: `${pendingItems} pending items`, sub: "Awaiting processing", color: "#f59e0b", bg: "#fffbeb" },
            { icon: "⚠️", count: `${outOfStock} products`, sub: "Out of stock", color: "#ef4444", bg: "#fef2f2" },
          ].map((c) => (
            <div key={c.sub} style={{
              display: "flex", alignItems: "center", gap: 14, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", flex: 1,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 17 }}>{c.count}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row: Total Sells + Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          
          {/* Total Revenue Chart */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Total Revenue Overview</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Payment received across all your items</div>
              </div>
              <select style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#64748b", cursor: "pointer", outline: "none" }}>
                <option>Last 15 Days</option>
              </select>
            </div>
            <div style={{ position: "relative", marginTop: 24 }}>
              <LineChart data={chartSalesData} color="#3b82f6" height={180} fill />
              <div style={{ position: "absolute", bottom: -20, left: 0, right: 0, display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 11, padding: "0 4px" }}>
                <span>{last15Days[0]}</span><span>{last15Days[7]}</span><span>{last15Days[14]}</span>
              </div>
            </div>
          </div>

          {/* Right stats stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Total Orders */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Total Units Sold</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 700 }}>{totalItemsSold}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Across all products</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <BarChart data={chartOrdersData} color="#93c5fd" />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: "#1d4ed8", borderRadius: 3 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Completed</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.round(deliveredPercentage)}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: "#93c5fd", borderRadius: 3 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Pending</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.round(100 - deliveredPercentage || 0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          
          {/* Active vs Inactive Inventory */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Inventory Health</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16, marginTop: 4 }}>Current stock distribution</div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <DonutChart value={activeProducts > 0 ? ((activeProducts - outOfStock) / activeProducts) * 100 : 0} color="#3b82f6" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Active & In-Stock", value: activeProducts - outOfStock, color: "#3b82f6" },
                  { label: "Out of Stock", value: outOfStock, color: "#93c5fd" },
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
          </div>

          {/* Fulfillment Status */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Order Fulfillment</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16, marginTop: 4 }}>Overall platform tracking</div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <GaugeChart value={payingCustomerPercentage} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Fulfilled Items", value: `${Math.round(payingCustomerPercentage)}%`, color: "#3b82f6" },
                  { label: "Pending Processing", value: `${Math.round(100 - payingCustomerPercentage || 0)}%`, color: "#e2e8f0" },
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
          </div>
        </div>

        {/* Latest Sales Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Latest Item Sales</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Your most recent successfully placed orders</div>
            </div>
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
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
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
                        background: (r.status === "DELIVERED" || r.status === "APPROVED") ? "#f0fdf4" : "#fff7ed",
                        color: (r.status === "DELIVERED" || r.status === "APPROVED") ? "#10b981" : "#f97316",
                        border: `1px solid ${(r.status === "DELIVERED" || r.status === "APPROVED") ? "#bbf7d0" : "#fed7aa"}`,
                      }}>
                        {(r.status === "DELIVERED" || r.status === "APPROVED") ? "✓ " : ""}{r.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                      {r.time}
                    </td>
                  </tr>
                ))}
                
                {recentSales.length === 0 && (
                   <tr>
                     <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No recent sales yet. Upload some products to get started!</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
