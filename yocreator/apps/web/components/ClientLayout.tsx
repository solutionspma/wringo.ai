"use client";
import { usePathname } from 'next/navigation';
import { AuthProvider } from "../lib/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Full-screen routes that don't need NavBar/Footer
  const isFullScreen = pathname?.startsWith('/studio/avatarEngine');
  
  if (isFullScreen) {
    return (
      <AuthProvider>
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </AuthProvider>
    );
  }
  
  return (
    <AuthProvider>
      <ProtectedRoute>
        <NavBar />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </ProtectedRoute>
    </AuthProvider>
  );
}
