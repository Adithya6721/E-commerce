import api from "./api";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get("http://localhost:8082/products");
  return res.data;
};