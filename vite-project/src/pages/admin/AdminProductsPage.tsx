import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminToast,
  formatApiError,
  formatMoney,
  type ToastTone,
} from "@/components/admin/AdminUi";
import {
  deleteProduct,
  getProducts,
  type Product,
} from "@/services/productService";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

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
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProductsPage();
  }, []);

  const removeProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await deleteProduct(id);
      showToast("Product permanently deleted from the platform.", "success");
      await loadProductsPage();
    } catch (error) {
      showToast(`Delete failed: ${formatApiError(error)}`, "error");
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Content Moderation"
        title="Global Product Catalog"
        description="Monitor the items listed by verified sellers. Delete items that violate terms of service."
      />

      <AdminToast toast={toast} />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Failed to load product catalog: {loadError}
        </div>
      )}

      <AdminPanel title="Seller Listings">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading catalog...</p>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
            <p className="text-sm text-slate-500">The platform catalog is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-400 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item details</th>
                  <th className="px-6 py-4">Price / Stock</th>
                  <th className="px-6 py-4">Seller ID</th>
                  <th className="px-6 py-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-xs">{product.name}</p>
                          <span className="text-[10px] uppercase font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-full mt-1 inline-block">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{formatMoney(product.price)}</p>
                      <p className="text-xs text-slate-500 mt-1">{product.stock} units left</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500">{product.sellerId || "System Admin"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => void removeProduct(product.id, product.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Takedown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
