import { useEffect, useState } from "react";
import { getProducts, type Product } from "../services/productService";
import { addToCart } from "../services/cartService";
import ProductCard from "../services/ProductCard";
import SearchBar from "../components/SeachBar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const { username } = useAuth();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setFiltered(data);
    });
  }, []);

  const handleSearch = (term: string) => {
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(term.toLowerCase())));
  };

  const handleAdd = (productId: string) => {
    if (!username) return alert("Login first");
    addToCart(username, { productId, quantity: 1 });
  };

  return (
    <div>
      <Navbar />
      <SearchBar onSearch={handleSearch} />

      {filtered.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={handleAdd} />
      ))}
    </div>
  );
}