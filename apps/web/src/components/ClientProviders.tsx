"use client";

import GrowthBookProvider from "@/components/GrowthBookProvider";
import { CartProvider } from "@/lib/cart";
import { UserProvider } from "@/contexts/UserContext";
import Sidebar from "@/components/Sidebar";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GrowthBookProvider>
      <UserProvider>
        <CartProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </CartProvider>
      </UserProvider>
    </GrowthBookProvider>
  );
}
