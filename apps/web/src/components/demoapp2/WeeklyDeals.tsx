"use client";

import { useRef, useState } from "react";
import type { GroceryProduct } from "@/data/safeway-products";
import type { WeeklyDealsSectionProps } from "@/lib/layout-types";

function BadgeChip({ badge }: { badge: "Sale" | "New" | "BOGO" | "Hot" }) {
  const styles: Record<string, string> = {
    Sale: "bg-gradient-to-r from-[#E41720] to-[#ff4d54]",
    New: "bg-gradient-to-r from-emerald-600 to-emerald-400",
    BOGO: "bg-gradient-to-r from-violet-600 to-violet-400",
    Hot: "bg-gradient-to-r from-amber-500 to-orange-400",
  };

  return (
    <span
      className={`absolute top-2.5 left-0 px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wider text-white rounded-r-full shadow-sm ${styles[badge]}`}
    >
      {badge === "BOGO" ? "Buy 1 Get 1" : badge === "Hot" ? "Hot Deal" : badge}
    </span>
  );
}

function MemberPriceBadge({ tier }: { tier: string }) {
  if (tier === "gold") {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded">
        Gold Price
      </span>
    );
  }
  if (tier === "silver") {
    return (
      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 rounded">
        Member Price
      </span>
    );
  }
  return null;
}

export default function WeeklyDeals({
  products,
  layout,
  title,
  subtitle,
  showUpsell,
  memberTier,
}: WeeklyDealsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState<Set<string>>(new Set());

  const handleClip = (id: string) => {
    setClipped((prev) => new Set(prev).add(id));
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -640 : 640;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Render product card (shared between grid and scroll layout)
  const renderCard = (product: GroceryProduct) => {
    const isClipped = clipped.has(product.id);
    return (
      <div
        key={product.id}
        className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${
          layout === "grid" ? "w-full" : "flex-none w-[200px]"
        }`}
      >
        {/* Product image */}
        <div className="relative bg-gray-50 h-[180px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            width={200}
            height={180}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.badge && <BadgeChip badge={product.badge} />}
        </div>

        {/* Product info */}
        <div className="p-3.5">
          <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
            {product.name}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 mb-3 line-clamp-1">
            {product.description}
          </p>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">
              {product.offerPrice}
            </span>
            {memberTier && <MemberPriceBadge tier={memberTier} />}
          </div>

          {/* CTA */}
          <button
            onClick={() => handleClip(product.id)}
            className={`w-full py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
              isClipped
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-[#E41720] text-white hover:bg-[#c21018] active:bg-[#8a0e14] shadow-sm hover:shadow-md"
            }`}
          >
            {isClipped ? "\u2713 Clipped" : "Clip Deal"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        {layout === "scroll" && (
          <div className="flex gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Grid layout */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map(renderCard)}
        </div>
      ) : (
        /* Scroll layout (default) */
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map(renderCard)}
          </div>
        </div>
      )}

      {/* Non-signed-in upsell */}
      {showUpsell && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Sign in for member pricing and exclusive deals
          </p>
        </div>
      )}
    </section>
  );
}
