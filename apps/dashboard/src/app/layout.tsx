import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Experiment Manager",
  description: "AI-native experiment and feature flag management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
