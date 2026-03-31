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

export const getCart = async (userId: string): Promise<Cart> => {
  const res = await api.get(`http://localhost:8083/cart/${userId}`);
  return res.data;
};

export const addToCart = async (userId: string, item: CartItem) => {
  const res = await api.post(`http://localhost:8083/cart/${userId}`, item);
  return res.data;
};