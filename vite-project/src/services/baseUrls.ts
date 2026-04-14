const userApiBaseUrl =
  import.meta.env.VITE_USER_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8081" : "");

const productApiBaseUrl =
  import.meta.env.VITE_PRODUCT_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8082" : "");

const cartApiBaseUrl =
  import.meta.env.VITE_CART_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8083" : "");

const orderApiBaseUrl =
  import.meta.env.VITE_ORDER_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8084" : "");

export const API_BASE_URLS = {
  user: userApiBaseUrl,
  product: productApiBaseUrl,
  cart: cartApiBaseUrl,
  order: orderApiBaseUrl,
};
