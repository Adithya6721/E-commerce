import api from "./api";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get("http://localhost:8082/products");
  return res.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get(`http://localhost:8082/products/${id}`);
  return res.data;
};
