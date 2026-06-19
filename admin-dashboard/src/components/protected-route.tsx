import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import type { AdminRole } from "@/types";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: "admin" | "doctor";
  allowedAdminRoles?: AdminRole[];
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedAdminRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedAdminRoles && user?.role === "admin") {
    // If user is admin but doesn't have an adminRole (legacy), or has one that isn't in the allowed list
    if (!user.adminRole || !allowedAdminRoles.includes(user.adminRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
