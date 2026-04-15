import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Routes that are only for CUSTOMER role.
// If a SELLER tries to access these, redirect them to their dashboard.
const CUSTOMER_ONLY_PATHS = ["/", "/cart", "/checkout", "/orders"];

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactElement;
  requiredRole?: string;
}) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and the user doesn't have it, redirect them
  // to their own home (SELLER -> /seller, others -> /)
  if (requiredRole && role !== requiredRole) {
    if (role === "SELLER") {
      return <Navigate to="/seller" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Block SELLER from customer-only shopping pages
  if (role === "SELLER" && CUSTOMER_ONLY_PATHS.includes(window.location.pathname)) {
    return <Navigate to="/seller" replace />;
  }

  // Block SELLER from /orders/:id and /products/:id paths  
  if (role === "SELLER") {
    const path = window.location.pathname;
    if (path.startsWith("/orders/") || path.startsWith("/products/")) {
      return <Navigate to="/seller" replace />;
    }
  }

  return children;
}
