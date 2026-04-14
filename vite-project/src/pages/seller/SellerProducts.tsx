import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProducts, createProduct, updateProduct, deleteProduct, type Product } from "../../services/productService";
import { fileToBase64 } from "../../utils/fileUtils";
import { Plus, Edit2, Trash2, X, UploadCloud, Package } from "lucide-react";

export default function SellerProducts() {
  const { username } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });
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

  useEffect(() => {
    void loadProducts();
  }, [username]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        image: product.image || "",
      });
    } else {
      setEditingProduct(null);
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        image: "",
      });
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Image is too large. Please upload an image under 2MB.");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setForm((f) => ({ ...f, image: base64 }));
        setFormError("");
      } catch {
        setFormError("Failed to process image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category || !form.image) {
      setFormError("Please fill in all required fields and upload an image.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const productPayload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      image: form.image,
      sellerId: username || "",
      averageRating: editingProduct?.averageRating || 0,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload);
      } else {
        await createProduct(productPayload);
      }
      setIsModalOpen(false);
      void loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        void loadProducts();
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500">Loading your products...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your inventory, prices, and listings.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No products listed</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">Get started by adding your first product to your store catalog.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Stock</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">Rs {product.price}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.stock > 10 ? "bg-emerald-50 text-emerald-700" :
                        product.stock > 0 ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      }`}>
                        {product.stock} left
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDelete(product.id)}
                          className="rounded-lg p-2 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {formError && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

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
                              Change Image
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                              <label className="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
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
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                      placeholder="E.g. MacBook Pro M3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Price (Rs)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                      placeholder="149999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Stock</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                      placeholder="10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                    >
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
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                      placeholder="Describe your product..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
