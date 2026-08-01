import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getProducts, createProduct, updateProduct, deleteProduct, type Product } from "../../services/productService";
import { fileToBase64 } from "../../utils/fileUtils";
import { Plus, Edit2, Trash2, X, UploadCloud, Package } from "lucide-react";

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay, ease: "easeOut" } as any });
const glossyStyle = { background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" };

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-5 w-20 rounded-full bg-slate-200" /></td>
      <td className="px-6 py-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-slate-200" /></td>
      <td className="px-6 py-4 text-right">
        <div className="ml-auto h-5 w-24 rounded-full bg-slate-200" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="ml-auto flex justify-end gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
        </div>
      </td>
    </tr>
  );
}

// ─── Stock Bar ────────────────────────────────────────────────────────────────
function StockBar({ stock, max = 50 }: { stock: number; max?: number }) {
  const pct = Math.min((stock / max) * 100, 100);
  const color = stock > 10 ? "#10b981" : stock > 0 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 64, height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        stock > 10 ? "bg-emerald-50 text-emerald-700" :
        stock > 0  ? "bg-amber-50 text-amber-700" :
                     "bg-rose-50 text-rose-700"
      }`}>
        {stock} left
      </span>
    </div>
  );
}

export default function SellerProducts() {
  const { username } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({ name: "", description: "", price: "", originalPrice: "", stock: "", category: "", image: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const allProds = await getProducts();
      setProducts(allProds.filter((p) => p.sellerId === username));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, [username]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({ name: product.name, description: product.description || "", price: product.price.toString(), originalPrice: product.originalPrice?.toString() || "", stock: product.stock.toString(), category: product.category, image: product.image || "" });
    } else {
      setEditingProduct(null);
      setForm({ name: "", description: "", price: "", originalPrice: "", stock: "", category: "", image: "" });
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { setFormError("Image is too large. Please upload an image under 2MB."); return; }
      try { const base64 = await fileToBase64(file); setForm((f) => ({ ...f, image: base64 })); setFormError(""); }
      catch { setFormError("Failed to process image."); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category || !form.image) { setFormError("Please fill in all required fields and upload an image."); return; }
    setIsSubmitting(true); setFormError("");
    const productPayload = { name: form.name, description: form.description, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined, stock: Number(form.stock), category: form.category, image: form.image, sellerId: username || "", averageRating: editingProduct?.averageRating || 0 };
    try {
      if (editingProduct) { await updateProduct(editingProduct.id, productPayload); }
      else { await createProduct(productPayload); }
      setIsModalOpen(false); void loadProducts();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save product."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try { await deleteProduct(id); void loadProducts(); }
      catch { alert("Failed to delete product."); }
    }
  };

  // Derived stats
  const inStock = products.filter(p => p.stock > 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const oos = products.filter(p => p.stock === 0).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
            {!isLoading && products.length > 0 && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                {products.length} listing{products.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">Manage your inventory, prices, and listings.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-sm hover:shadow-indigo-600/20 hover:shadow-lg">
          <Plus className="h-4 w-4" /> Add New Product
        </button>
      </div>

      {/* Quick stat strip */}
      {!isLoading && products.length > 0 && (
        <motion.div {...fadeUp(0.1)} className="mt-5 grid grid-cols-3 gap-4">
          {[
            { label: "In Stock", value: inStock, color: "text-emerald-700", bg: "bg-emerald-50/50" },
            { label: "Low Stock (≤5)", value: lowStock, color: "text-amber-700", bg: "bg-amber-50/50" },
            { label: "Out of Stock", value: oos, color: "text-rose-700", bg: "bg-rose-50/50" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
              style={glossyStyle}
              className={`flex items-center justify-between px-5 py-4 ${s.bg}`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Table / Skeleton / Empty */}
      {isLoading ? (
        <motion.div {...fadeUp(0.2)} style={glossyStyle} className="mt-8 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-right">Price</th>
                <th className="px-6 py-4 font-semibold text-right">Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </motion.div>
      ) : products.length === 0 ? (
        <motion.div {...fadeUp(0.2)} style={glossyStyle} className="mt-10 flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/50 mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No products listed</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">Get started by adding your first product to your store catalog.</p>
        </motion.div>
      ) : (
        <motion.div {...fadeUp(0.2)} style={glossyStyle} className="mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Stock</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {products.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.6)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 truncate max-w-[200px]">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-900">Rs {product.price.toLocaleString()}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-slate-400 line-through">Rs {product.originalPrice.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StockBar stock={product.stock} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleOpenModal(product)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100/80 hover:text-slate-700" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => void handleDelete(product.id)} className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50/80 hover:text-rose-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              {formError && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>}
              <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Product Image</label>
                    <div className="mt-1 flex justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-8 hover:border-indigo-400 transition-colors bg-slate-50">
                      <div className="text-center">
                        {form.image ? (
                          <div className="relative mx-auto h-32 w-32 rounded-xl overflow-hidden border">
                            <img src={form.image} className="object-cover h-full w-full" alt="Preview" />
                            <label className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-[10px] text-white font-semibold cursor-pointer hover:bg-black/70">
                              Change Image<input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                              <label className="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 hover:text-indigo-500">
                                <span>Upload an image</span>
                                <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                              </label>
                            </div>
                            <p className="text-xs leading-5 text-slate-500">PNG or JPG up to 2MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="E.g. MacBook Pro M3" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Selling Price (Rs)</label>
                    <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="149999" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Original Price (optional)</label>
                    <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="160000" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Stock</label>
                    <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="10" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white">
                      <option value="">Select a Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Audio">Audio</option>
                      <option value="Computers">Computers</option>
                      <option value="Wearables">Wearables</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                    <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Describe your product..." />
                  </div>
                </div>
              </form>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">Cancel</button>
              <button type="submit" form="productForm" disabled={isSubmitting} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
