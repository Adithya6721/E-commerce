import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get(`${API_BASE_URLS.product}/products`);
  return res.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get(`${API_BASE_URLS.product}/products/${id}`);
  return res.data;
};
