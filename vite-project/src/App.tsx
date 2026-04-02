import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";

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
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
