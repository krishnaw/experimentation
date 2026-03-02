"use client";

import { useRef, useMemo } from "react";
import { groceryCategories } from "@/data/safeway-categories";
import { useUser } from "@/contexts/UserContext";

/** Persona-specific category orderings — prioritizes relevant categories */
const categoryOrderByBehavior: Record<string, string[]> = {
  // Frequent shoppers: premium, fresh items first
  frequent: ["meat", "produce", "organic", "wine", "deli", "bakery", "dairy", "frozen", "beverages", "snacks", "pantry", "breakfast", "health", "household", "baby", "pet"],
  // Occasional shoppers: pantry staples, easy meals
  occasional: ["pantry", "frozen", "beverages", "snacks", "dairy", "bakery", "produce", "meat", "deli", "breakfast", "household", "health", "organic", "baby", "pet", "wine"],
  // New shoppers: discovery-oriented, popular first
  new: ["produce", "snacks", "beverages", "bakery", "dairy", "frozen", "breakfast", "pantry", "meat", "deli", "organic", "health", "household", "baby", "pet", "wine"],
};

/** Household-type refinements */
const categoryBoostByHousehold: Record<string, string[]> = {
  family: ["baby", "snacks", "breakfast"],
  senior: ["health", "organic", "produce"],
  single: ["frozen", "snacks", "beverages"],
  couple: ["wine", "organic", "deli"],
};

export default function CategoryGrid() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { persona, isSignedIn, remoteFeatures } = useUser();

  const orderedCategories = useMemo(() => {
    // Check if there's a remote feature override for category order
    const remoteOrder = remoteFeatures["demoapp2-category-order"] as string | undefined;
    if (remoteOrder === "personalized" && persona) {
      const behavior = persona.attributes.shopping_behavior;
      const household = persona.attributes.household_type;
      const baseOrder = categoryOrderByBehavior[behavior] || [];
      const boosts = categoryBoostByHousehold[household] || [];

      return [...groceryCategories].sort((a, b) => {
        // Boosted categories get priority
        const aBoost = boosts.includes(a.id) ? -10 : 0;
        const bBoost = boosts.includes(b.id) ? -10 : 0;
        const aIdx = baseOrder.indexOf(a.id);
        const bIdx = baseOrder.indexOf(b.id);
        return (aIdx + aBoost) - (bIdx + bBoost);
      });
    }

    // If signed in but no specific override, use behavior-based ordering
    if (isSignedIn && persona) {
      const behavior = persona.attributes.shopping_behavior;
      const order = categoryOrderByBehavior[behavior];
      if (order) {
        return [...groceryCategories].sort((a, b) => {
          const aIdx = order.indexOf(a.id);
          const bIdx = order.indexOf(b.id);
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
      }
    }

    return groceryCategories;
  }, [persona, isSignedIn, remoteFeatures]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          {isSignedIn && (
            <p className="text-[11px] text-gray-400 mt-0.5">Personalized for you</p>
          )}
        </div>
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
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {orderedCategories.map((cat) => (
            <button
              key={cat.id}
              className="flex-none flex flex-col items-center gap-2.5 w-[82px] py-2 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-4 group-hover:ring-red-200 active:ring-red-300 transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-[11px] font-medium text-gray-500 group-hover:text-gray-900 text-center leading-tight whitespace-nowrap transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
