import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, RefreshCw, Shield, Trash2, TrendingUp, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { DemoHeroGeometric } from "@/components/ui/demo";
import {
  createProduct,
  deleteProduct,
  getProductSummary,
  getProducts,
  updateProduct,
  updateProductStock,
  type Product,
  type ProductInput,
  type ProductSummary,
} from "../services/productService";
import { getUsers, getUserSummary, type UserRecord, type UserSummary } from "../services/userService";
import { getCartSummary, type CartSummary } from "../services/cartService";

const EMPTY_FORM: ProductInput = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "",
  image: "",
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
];

type ToastTone = "success" | "error";

export default function AdminDashboard() {
  const { username } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStockId, setPendingStockId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 5), [products]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [productsData, usersData, productStats, userStats, cartStats] = await Promise.all([
        getProducts(),
        getUsers(),
        getProductSummary(),
        getUserSummary(),
        getCartSummary(),
      ]);
      setProducts(productsData);
      setUsers(usersData);
      setProductSummary(productStats);
      setUserSummary(userStats);
      setCartSummary(cartStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submitProduct = async () => {
    setIsSaving(true);
    try {
      const payload: ProductInput = {
        ...form,
        image: form.image.trim() || FALLBACK_IMAGES[products.length % FALLBACK_IMAGES.length],
        category: form.category.trim() || "General",
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        showToast("Product updated successfully.", "success");
      } else {
        await createProduct(payload);
        showToast("Product created successfully.", "success");
      }

      resetForm();
      await loadDashboard();
    } catch {
      showToast("Product save failed. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      category: product.category,
      image: product.image,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      if (editingId === id) {
        resetForm();
      }
      showToast("Product deleted.", "success");
      await loadDashboard();
    } catch {
      showToast("Could not delete product.", "error");
    }
  };

  const changeStock = async (product: Product, delta: number) => {
    try {
      setPendingStockId(product.id);
      await updateProductStock(product.id, Math.max(product.stock + delta, 0));
      await loadDashboard();
    } catch {
      showToast("Stock update failed.", "error");
    } finally {
      setPendingStockId(null);
    }
  };

  const formatMoney = (value: number | undefined) => `Rs ${Math.round(value ?? 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />

      <section className="relative">
        <DemoHeroGeometric />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-100 to-transparent" />
      </section>

      <main className="mx-auto -mt-24 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative z-10 space-y-8">
          <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Admin Control</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back, {username}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Manage the catalog, monitor stock health, review user growth, and track projected revenue from active carts.
                </p>
              </div>
              <button
                onClick={() => void loadDashboard()}
                className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Dashboard
              </button>
            </div>

            {toast && (
              <div
                className={`mt-6 rounded-2xl px-4 py-3 text-sm font-medium ${
                  toast.tone === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {toast.message}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Products" value={productSummary?.totalProducts ?? 0} detail="Catalog items live" icon={<Plus className="h-5 w-5" />} />
            <StatCard title="Users" value={userSummary?.totalUsers ?? 0} detail={`${userSummary?.totalAdmins ?? 0} admins, ${userSummary?.totalCustomers ?? 0} customers`} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Stock Units" value={productSummary?.totalUnitsInStock ?? 0} detail={`${productSummary?.lowStockProducts ?? 0} low-stock products`} icon={<Shield className="h-5 w-5" />} />
            <StatCard title="Projected Revenue" value={formatMoney(cartSummary?.projectedRevenue)} detail={`${cartSummary?.cartsWithItems ?? 0} active carts`} icon={<TrendingUp className="h-5 w-5" />} />
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
            <div className="space-y-8">
              <Panel title={editingId ? "Edit Product" : "Add Product"}>
                <div className="grid gap-4">
                  <Field label="Product Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
                  <FieldArea label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
                    <Field label="Image URL" value={form.image} onChange={(value) => setForm((current) => ({ ...current, image: value }))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Price" type="number" value={String(form.price)} onChange={(value) => setForm((current) => ({ ...current, price: Number(value) || 0 }))} />
                    <Field label="Stock" type="number" value={String(form.stock)} onChange={(value) => setForm((current) => ({ ...current, stock: Number(value) || 0 }))} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => void submitProduct()}
                      disabled={isSaving}
                      className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      {isSaving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                    </button>
                    {editingId && (
                      <button
                        onClick={resetForm}
                        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel title="Revenue Analytics">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MiniStat label="Projected Revenue" value={formatMoney(cartSummary?.projectedRevenue)} />
                  <MiniStat label="Inventory Value" value={formatMoney(productSummary?.totalInventoryValue)} />
                  <MiniStat label="Active Carts" value={cartSummary?.cartsWithItems ?? 0} />
                  <MiniStat label="Items in Carts" value={cartSummary?.totalItemsInCarts ?? 0} />
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Revenue is projected from active cart totals until a completed-orders pipeline is added.
                </p>
              </Panel>
            </div>

            <div className="space-y-8">
              <Panel title="Catalog and Stock">
                {isLoading ? (
                  <p className="text-sm text-slate-500">Loading products...</p>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex gap-4">
                            <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">{product.category}</p>
                              <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
                              <p className="mt-1 max-w-xl text-sm text-slate-600">{product.description || "No description added yet."}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                                <span>{formatMoney(product.price)}</span>
                                <span>Stock: {product.stock}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEdit(product)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => void removeProduct(product.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => void changeStock(product, -1)}
                            disabled={pendingStockId === product.id}
                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
                          >
                            -1 stock
                          </button>
                          <button
                            onClick={() => void changeStock(product, 5)}
                            disabled={pendingStockId === product.id}
                            className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            +5 stock
                          </button>
                          {product.stock <= 5 && (
                            <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                              Low stock
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Users">
                <div className="overflow-hidden rounded-3xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Username</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                              user.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Low Stock Watchlist">
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-slate-500">All products have healthy stock right now.</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                        <div>
                          <p className="font-semibold text-amber-900">{product.name}</p>
                          <p className="text-sm text-amber-700">{product.stock} units left</p>
                        </div>
                        <button
                          onClick={() => void changeStock(product, 10)}
                          disabled={pendingStockId === product.id}
                          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                        >
                          Refill +10
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
      <p className="mt-6 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
    </label>
  );
}

function FieldArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
    </label>
  );
}
