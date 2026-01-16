'use client';

import { AuthProvider } from "../../../lib/AuthContext";

export default function AvatarEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
