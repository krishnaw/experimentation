"use client";

import { useFeatureValue, useFeatureIsOn } from "@growthbook/growthbook-react";
import { groceryProducts } from "@/data/safeway-products";
import { useUser } from "@/contexts/UserContext";
import SafewayHeader from "@/components/demoapp2/SafewayHeader";
import HeroBanner from "@/components/demoapp2/HeroBanner";
import FreshSection from "@/components/demoapp2/FreshSection";
import CategoryGrid from "@/components/demoapp2/CategoryGrid";
import WeeklyDeals from "@/components/demoapp2/WeeklyDeals";
import SafewayFooter from "@/components/demoapp2/SafewayFooter";

export default function DemoApp2Page() {
  const { isSignedIn, remoteFeatures } = useUser();

  // Always call hooks (React rules) — then override with remote values when signed in
  const clientHeroLayout = useFeatureValue("demoapp2-hero-layout", "carousel");
  const clientFreshEnabled = useFeatureIsOn("demoapp2-fresh-section");
  const clientDealsSort = useFeatureValue("demoapp2-deals-sort", "popularity");

  // Prefer server-evaluated features when signed in
  const heroLayout = (isSignedIn && remoteFeatures["demoapp2-hero-layout"] != null)
    ? String(remoteFeatures["demoapp2-hero-layout"])
    : clientHeroLayout;
  const freshEnabled = (isSignedIn && remoteFeatures["demoapp2-fresh-section"] != null)
    ? Boolean(remoteFeatures["demoapp2-fresh-section"])
    : clientFreshEnabled;
  const dealsSort = (isSignedIn && remoteFeatures["demoapp2-deals-sort"] != null)
    ? String(remoteFeatures["demoapp2-deals-sort"])
    : clientDealsSort;

  // Sort products for weekly deals
  const sortedProducts = [...groceryProducts].sort((a, b) => {
    if (dealsSort === "price") {
      const priceA = parseFloat(a.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      const priceB = parseFloat(b.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      return priceA - priceB;
    }
    return b.popularity - a.popularity;
  });

  return (
    <div className="min-h-screen bg-white">
      <SafewayHeader />
      <HeroBanner mode={heroLayout as "carousel" | "single" | "member-rewards"} />
      {freshEnabled && <FreshSection />}
      <CategoryGrid />
      <WeeklyDeals products={sortedProducts} />
      <SafewayFooter />
    </div>
  );
}
