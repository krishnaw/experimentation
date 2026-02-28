"use client";

import GrowthBookProvider from "@/components/GrowthBookProvider";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GrowthBookProvider>
      <CartProvider>
        <Header />
        <main>{children}</main>
      </CartProvider>
    </GrowthBookProvider>
  );
}
