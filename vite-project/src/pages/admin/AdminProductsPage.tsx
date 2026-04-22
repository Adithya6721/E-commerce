import { useEffect, useState } from "react";
import { Trash2, Info } from "lucide-react";
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

const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1", name: "Premium Wireless Headphones", price: 2499, originalPrice: 3999,
    stock: 45, category: "Electronics", sellerId: "seller_anita",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
  },
  {
    id: "mock-2", name: "Organic Cotton T-Shirt", price: 899, originalPrice: 1299,
    stock: 120, category: "Fashion", sellerId: "seller_priya",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
  },
  {
    id: "mock-3", name: "Smart Fitness Watch", price: 3499, originalPrice: 4999,
    stock: 28, category: "Electronics", sellerId: "seller_anita",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
  },
  {
    id: "mock-4", name: "Artisan Coffee Beans (500g)", price: 649,
    stock: 200, category: "Food & Beverages", sellerId: "seller_vikram",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop",
  },
  {
    id: "mock-5", name: "Leather Messenger Bag", price: 4299, originalPrice: 5999,
    stock: 15, category: "Fashion", sellerId: "seller_priya",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
  },
  {
    id: "mock-6", name: "Bluetooth Portable Speaker", price: 1799, originalPrice: 2499,
    stock: 62, category: "Electronics", sellerId: "seller_anita",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop",
  },
  {
    id: "mock-7", name: "Ceramic Plant Pot Set", price: 1199,
    stock: 85, category: "Home & Garden", sellerId: "seller_priya",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&h=100&fit=crop",
  },
  {
    id: "mock-8", name: "Yoga Mat Premium", price: 1499, originalPrice: 1999,
    stock: 3, category: "Sports", sellerId: "seller_vikram",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100&h=100&fit=crop",
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const loadProductsPage = async () => {
    setIsLoading(true);
    setLoadError(null);
    setIsUsingMock(false);
    try {
      const productsData = await getProducts();
      if (productsData.length === 0) {
        setProducts(MOCK_PRODUCTS);
        setIsUsingMock(true);
      } else {
        setProducts(productsData);
      }
    } catch (error) {
      console.warn("Product API unavailable, using demo data:", error);
      setProducts(MOCK_PRODUCTS);
      setIsUsingMock(true);
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProductsPage();
  }, []);

  const removeProduct = async (id: string, name: string) => {
    if (id.startsWith("mock-")) {
      showToast("Cannot delete demo products. This action works with live data.", "error");
      return;
    }
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

      {isUsingMock && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <Info className="h-4 w-4 flex-shrink-0" />
          {loadError
            ? `Backend unavailable (${loadError}). Showing demo catalog to preview UI layout.`
            : "No products in the database yet. Showing demo catalog to preview UI layout."}
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
