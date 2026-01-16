"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check while loading
    if (loading) return;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname?.startsWith(route + "/")
    );

    // If not authenticated and trying to access protected route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/studio")}`);
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not authenticated and not on public route, show nothing (redirecting)
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + "/")
  );
  
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
