import { useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
  AdminField,
  AdminFieldArea,
  AdminPageHeader,
  AdminPanel,
  AdminToast,
  formatApiError,
  formatMoney,
  type ToastTone,
} from "@/components/admin/AdminUi";
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
} from "@/services/productService";

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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStockId, setPendingStockId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 5), [products]);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const loadProductsPage = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [productsData, summary] = await Promise.all([getProducts(), getProductSummary()]);
      setProducts(productsData);
      setProductSummary(summary);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProductsPage();
  }, []);

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
      await loadProductsPage();
    } catch (error) {
      showToast(`Product save failed: ${formatApiError(error)}`, "error");
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
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      if (editingId === id) {
        resetForm();
      }
      showToast("Product deleted.", "success");
      await loadProductsPage();
    } catch (error) {
      showToast(`Delete failed: ${formatApiError(error)}`, "error");
    }
  };

  const changeStock = async (product: Product, delta: number) => {
    try {
      setPendingStockId(product.id);
      await updateProductStock(product.id, Math.max(product.stock + delta, 0));
      await loadProductsPage();
    } catch (error) {
      showToast(`Stock update failed: ${formatApiError(error)}`, "error");
    } finally {
      setPendingStockId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Products"
        title="Manage your product catalog"
        description="This page handles product creation, editing, deletion, and stock updates. If the backend fails, the exact API error appears here instead of silent zeroes."
        action={
          <button
            onClick={() => void loadProductsPage()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Products
          </button>
        }
      />

      <AdminToast toast={toast} />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Product page could not load backend data: {loadError}
        </div>
      )}

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel title={editingId ? "Edit Product" : "Add Product"}>
          <div className="grid gap-4">
            <AdminField label="Product Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <AdminFieldArea label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Category" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
              <AdminField label="Image URL" value={form.image} onChange={(value) => setForm((current) => ({ ...current, image: value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Price" type="number" value={String(form.price)} onChange={(value) => setForm((current) => ({ ...current, price: Number(value) || 0 }))} />
              <AdminField label="Stock" type="number" value={String(form.stock)} onChange={(value) => setForm((current) => ({ ...current, stock: Number(value) || 0 }))} />
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
        </AdminPanel>

        <div className="space-y-8">
          <AdminPanel title="Catalog and Stock">
            <div className="mb-5 flex flex-wrap gap-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              <span>Total products: <strong>{productSummary?.totalProducts ?? "Unavailable"}</strong></span>
              <span>Total stock units: <strong>{productSummary?.totalUnitsInStock ?? "Unavailable"}</strong></span>
              <span>Inventory value: <strong>{productSummary ? formatMoney(productSummary.totalInventoryValue) : "Unavailable"}</strong></span>
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-500">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-slate-500">No products returned by the backend yet.</p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel title="Low Stock Watchlist">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No low-stock items returned by the backend.</p>
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
          </AdminPanel>
        </div>
      </section>
    </div>
  );
}
