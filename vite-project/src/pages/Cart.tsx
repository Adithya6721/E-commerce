import { useEffect, useState } from "react";
import { getCart, type Cart as CartType } from "../services/cartService";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const [cart, setCart] = useState<CartType | null>(null);
  const { username } = useAuth();
  const userId = username || "";

  useEffect(() => {
    getCart(userId).then(setCart);
  }, [userId]);

  if (!cart) return <div>No Cart</div>;

  return (
    <div>
      <h2>Your Cart</h2>
      {cart.items.map((item, i) => (
        <div key={i}>
          <p>{item.productId}</p>
          <p>Qty: {item.quantity}</p>
        </div>
      ))}
      <h3>Total: ₹{cart.totalPrice}</h3>
    </div>
  );
}
