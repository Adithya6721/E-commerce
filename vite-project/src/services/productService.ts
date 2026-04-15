import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  image: string;
  sellerId?: string;
  averageRating?: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  image: string;
  sellerId?: string;
  averageRating?: number;
}

export interface ProductSummary {
  totalProducts: number;
  totalUnitsInStock: number;
  lowStockProducts: number;
  totalInventoryValue: number;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get(`${API_BASE_URLS.product}/products`);
  return res.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get(`${API_BASE_URLS.product}/products/${id}`);
  return res.data;
};

export const createProduct = async (data: ProductInput): Promise<Product> => {
  const res = await api.post(`${API_BASE_URLS.product}/products`, data);
  return res.data;
};

export const updateProduct = async (id: string, data: ProductInput): Promise<Product> => {
  const res = await api.put(`${API_BASE_URLS.product}/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE_URLS.product}/products/${id}`);
};

export const updateProductStock = async (id: string, stock: number): Promise<Product> => {
  const res = await api.put(`${API_BASE_URLS.product}/products/${id}/stock`, { stock });
  return res.data;
};

export const getProductSummary = async (): Promise<ProductSummary> => {
  const res = await api.get(`${API_BASE_URLS.product}/products/admin/summary`);
  return res.data;
};
