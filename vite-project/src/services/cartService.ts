import axios from "axios";
import api from "./api";

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
}

export const CART_UPDATED_EVENT = "cart-updated";

const createEmptyCart = (userId: string): Cart => ({
  id: "",
  userId,
  items: [],
  totalPrice: 0,
});

const notifyCartUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
};

export const getCart = async (userId: string): Promise<Cart> => {
  if (!userId) {
    return createEmptyCart("");
  }

  try {
    const res = await api.get(`http://localhost:8083/cart/${userId}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return createEmptyCart(userId);
    }
    throw error;
  }
};

export const addToCart = async (userId: string, item: CartItem): Promise<Cart> => {
  const res = await api.post(`http://localhost:8083/cart/${userId}/items`, item);
  notifyCartUpdated();
  return res.data;
};

export const updateCartItemQuantity = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> => {
  const res = await api.put(
    `http://localhost:8083/cart/${userId}/items/${productId}`,
    { productId, quantity }
  );
  notifyCartUpdated();
  return res.data;
};

export const removeFromCart = async (
  userId: string,
  productId: string
): Promise<Cart> => {
  const res = await api.delete(`http://localhost:8083/cart/${userId}/items/${productId}`);
  notifyCartUpdated();
  return res.data;
};
