"use client";

import { useUser } from "@/contexts/UserContext";
import SafewayHeader from "@/components/demoapp2/SafewayHeader";
import HeroBanner from "@/components/demoapp2/HeroBanner";
import FreshSection from "@/components/demoapp2/FreshSection";
import CategoryGrid from "@/components/demoapp2/CategoryGrid";
import WeeklyDeals from "@/components/demoapp2/WeeklyDeals";
import SafewayFooter from "@/components/demoapp2/SafewayFooter";
import type { LayoutSection } from "@/lib/layout-types";

function renderSection(section: LayoutSection) {
  if (!section.visible) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = section.props as any;
  switch (section.component) {
    case "HeroBanner":
      return <HeroBanner key={section.id} {...p} />;
    case "FreshSection":
      return <FreshSection key={section.id} {...p} />;
    case "CategoryGrid":
      return <CategoryGrid key={section.id} {...p} />;
    case "WeeklyDeals":
      return <WeeklyDeals key={section.id} {...p} />;
    default:
      return null;
  }
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[240px] sm:h-[320px] bg-gray-200 rounded-2xl mb-8" />
      {/* Fresh section skeleton */}
      <div className="mb-8">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Categories skeleton */}
      <div className="mb-8">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded-full flex-none" />
          ))}
        </div>
      </div>
      {/* Deals skeleton */}
      <div>
        <div className="h-6 w-36 bg-gray-200 rounded mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[200px] h-[280px] bg-gray-200 rounded-2xl flex-none" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoApp2Page() {
  const { layout, loadingLayout } = useUser();

  return (
    <div className="min-h-screen bg-white">
      <SafewayHeader />
      {loadingLayout || !layout ? (
        <LoadingSkeleton />
      ) : (
        layout.sections.map(renderSection)
      )}
      <SafewayFooter />
    </div>
  );
}
