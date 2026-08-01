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
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay, ease: "easeOut" } as any });
const glossyStyle = { background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderRadius: 24, border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" };

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
          <motion.div {...fadeUp(0.1)} style={{ ...glossyStyle, borderStyle: "dashed" }} className="p-12 text-center">
            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
            <p className="text-sm text-slate-500">The platform catalog is currently empty.</p>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.1)} style={glossyStyle} className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-400 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item details</th>
                  <th className="px-6 py-4">Price / Stock</th>
                  <th className="px-6 py-4">Seller ID</th>
                  <th className="px-6 py-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {products.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.6)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-white" />
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-xs">{product.name}</p>
                          <span className="text-[10px] uppercase font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50/80 rounded-full mt-1 inline-block">{product.category}</span>
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => void removeProduct(product.id, product.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Takedown
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AdminPanel>
    </div>
  );
}
