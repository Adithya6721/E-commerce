import api from "./api";
import { API_BASE_URLS } from "./baseUrls";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_REJECTED"
  | "RETURN_APPROVED";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  sellerId: string;
  itemStatus?: OrderStatus;
  trackingId?: string;
  courierName?: string;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  changedBy: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingDetails: ShippingDetails;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  estimatedDelivery: string;
}

export interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  shippingDetails: ShippingDetails;
}

export const createOrder = async (data: CreateOrderRequest): Promise<OrderRecord> => {
  const res = await api.post(`${API_BASE_URLS.order}/orders`, data);
  return res.data;
};

export const getMyOrders = async (): Promise<OrderRecord[]> => {
  const res = await api.get(`${API_BASE_URLS.order}/orders/my`);
  return res.data;
};

export const getOrderById = async (orderId: string): Promise<OrderRecord> => {
  const res = await api.get(`${API_BASE_URLS.order}/orders/${orderId}`);
  return res.data;
};

export const getAllOrders = async (): Promise<OrderRecord[]> => {
  const res = await api.get(`${API_BASE_URLS.order}/orders/admin/all`);
  return res.data;
};

export const getSellerOrders = async (): Promise<OrderRecord[]> => {
  const res = await api.get(`${API_BASE_URLS.order}/orders/seller/my`);
  return res.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<OrderRecord> => {
  const res = await api.put(`${API_BASE_URLS.order}/orders/${orderId}/status`, { status });
  return res.data;
};

export const updateOrderItemStatus = async (
  orderId: string,
  productId: string,
  status: OrderStatus,
  trackingId?: string,
  courierName?: string
): Promise<OrderRecord> => {
  const res = await api.put(`${API_BASE_URLS.order}/orders/${orderId}/items/${productId}/status`, { 
    status,
    trackingId,
    courierName
  });
  return res.data;
};
