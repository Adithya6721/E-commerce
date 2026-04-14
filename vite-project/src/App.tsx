import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProductDetail from "./pages/ProductDetail";
import SellerApply from "./pages/SellerApply";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminSellersPage from "./pages/admin/AdminSellersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";

import SellerLayout from "./components/seller/SellerLayout";
import SellerOverview from "./pages/seller/SellerOverview";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/apply"
          element={
            <ProtectedRoute>
              <SellerApply />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
        <Route
          path="/seller"
          element={
            <ProtectedRoute requiredRole="SELLER">
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerOverview />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="orders" element={<SellerOrders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
