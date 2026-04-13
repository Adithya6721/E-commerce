import type { Cart } from "./cartService";
import type { Product } from "./productService";

export type OrderStatus =
  | "PROCESSING"
  | "DISPATCHED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: "CARD" | "UPI" | "COD";
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  upiId: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  category: string;
  image: string;
  quantity: number;
  price: number;
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: CheckoutFormData["paymentMethod"];
  shippingDetails: Pick<
    CheckoutFormData,
    "fullName" | "phone" | "address" | "city" | "pincode"
  >;
  createdAt: string;
  estimatedDelivery: string;
}

const ORDERS_KEY = "orders";

function readOrders(): OrderRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(ORDERS_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: OrderRecord[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

function buildEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toISOString();
}

export function getOrdersByUser(userId: string) {
  return readOrders()
    .filter((order) => order.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getOrderById(orderId: string) {
  return readOrders().find((order) => order.id === orderId) ?? null;
}

export function createOrderFromCart(
  userId: string,
  cart: Cart,
  productsMap: Record<string, Product>,
  form: CheckoutFormData
) {
  const order: OrderRecord = {
    id: `ORD-${Date.now()}`,
    userId,
    items: cart.items.map((item) => {
      const product = productsMap[item.productId];
      return {
        productId: item.productId,
        name: product?.name ?? item.productId,
        category: product?.category ?? "Product",
        image: product?.image ?? "",
        quantity: item.quantity,
        price: product?.price ?? 0,
      };
    }),
    totalAmount: cart.totalPrice,
    status: "PROCESSING",
    paymentMethod: form.paymentMethod,
    shippingDetails: {
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      city: form.city,
      pincode: form.pincode,
    },
    createdAt: new Date().toISOString(),
    estimatedDelivery: buildEstimatedDelivery(),
  };

  const orders = readOrders();
  writeOrders([order, ...orders]);
  return order;
}
