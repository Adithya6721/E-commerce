import { type Product } from "../services/productService";

interface Props {
  product: Product;
  onAdd: (id: string) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  return (
    <div style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}>
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
      <button onClick={() => onAdd(product.id)}>Add to Cart</button>
    </div>
  );
}