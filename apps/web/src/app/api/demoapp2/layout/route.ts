import { NextRequest, NextResponse } from "next/server";
import { GrowthBook } from "@growthbook/growthbook";
import { getBannersForTier } from "@/data/safeway-banners";
import { groceryCategories } from "@/data/safeway-categories";
import { groceryProducts } from "@/data/safeway-products";
import type { PageLayout, FreshCategory } from "@/lib/layout-types";

const GB_API_HOST =
  process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || "http://localhost:3100";
const GB_CLIENT_KEY =
  process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || "sdk-placeholder";

const freshCategories: FreshCategory[] = [
  { name: "Meat & Seafood", subtitle: "Premium cuts & fresh catch", icon: "\ud83e\udd69", image: "/images/demoapp2/fresh/meat.jpg" },
  { name: "Produce", subtitle: "Farm-fresh fruits & veggies", icon: "\ud83e\udd6c", image: "/images/demoapp2/fresh/produce.jpg" },
  { name: "Deli", subtitle: "Sliced fresh, made daily", icon: "\ud83e\udd6a", image: "/images/demoapp2/fresh/deli.jpg" },
  { name: "Bakery", subtitle: "Baked in-store every morning", icon: "\ud83c\udf5e", image: "/images/demoapp2/fresh/bakery.jpg" },
];

/** Persona-specific category orderings */
const categoryOrderByBehavior: Record<string, string[]> = {
  frequent: ["meat", "produce", "organic", "wine", "deli", "bakery", "dairy", "frozen", "beverages", "snacks", "pantry", "breakfast", "health", "household", "baby", "pet"],
  occasional: ["pantry", "frozen", "beverages", "snacks", "dairy", "bakery", "produce", "meat", "deli", "breakfast", "household", "health", "organic", "baby", "pet", "wine"],
  new: ["produce", "snacks", "beverages", "bakery", "dairy", "frozen", "breakfast", "pantry", "meat", "deli", "organic", "health", "household", "baby", "pet", "wine"],
};

/** Household-type refinements */
const categoryBoostByHousehold: Record<string, string[]> = {
  family: ["baby", "snacks", "breakfast"],
  senior: ["health", "organic", "produce"],
  single: ["frozen", "snacks", "beverages"],
  couple: ["wine", "organic", "deli"],
};

function applyCategoryOrdering(
  attributes: Record<string, unknown> | undefined,
  categoryOrderFlag: string | undefined
) {
  if (!attributes) return [...groceryCategories];

  const behavior = attributes.shopping_behavior as string | undefined;
  const household = attributes.household_type as string | undefined;

  // Full personalized ordering when flag is set
  if (categoryOrderFlag === "personalized" && behavior) {
    const baseOrder = categoryOrderByBehavior[behavior] || [];
    const boosts = household ? (categoryBoostByHousehold[household] || []) : [];

    return [...groceryCategories].sort((a, b) => {
      const aBoost = boosts.includes(a.id) ? -10 : 0;
      const bBoost = boosts.includes(b.id) ? -10 : 0;
      const aIdx = baseOrder.indexOf(a.id);
      const bIdx = baseOrder.indexOf(b.id);
      return (aIdx + aBoost) - (bIdx + bBoost);
    });
  }

  // Behavior-based ordering
  if (behavior && categoryOrderByBehavior[behavior]) {
    const order = categoryOrderByBehavior[behavior];
    return [...groceryCategories].sort((a, b) => {
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }

  return [...groceryCategories];
}

function sortProducts(dealsSort: string | undefined) {
  return [...groceryProducts].sort((a, b) => {
    if (dealsSort === "price") {
      const priceA = parseFloat(a.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      const priceB = parseFloat(b.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      return priceA - priceB;
    }
    return b.popularity - a.popularity;
  });
}

export async function POST(req: NextRequest) {
  let body: { userId?: string; attributes?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const userId = body.userId || "anonymous";
  const attributes = body.attributes;
  const tier = attributes?.membership_tier as string | undefined;
  const behavior = attributes?.shopping_behavior as string | undefined;
  const isSignedIn = !!attributes;

  // Evaluate GrowthBook flags server-side
  let flags: Record<string, unknown> = {};
  try {
    const url = `${GB_API_HOST}/api/features/${GB_CLIENT_KEY}?_cb=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const payload = await res.json();
      const gb = new GrowthBook({
        apiHost: GB_API_HOST,
        clientKey: GB_CLIENT_KEY,
      });
      await gb.setPayload(payload);
      gb.setAttributes({ id: userId, ...(attributes || {}) });

      const allFeatures = gb.getFeatures();
      for (const key of Object.keys(allFeatures)) {
        if (key.startsWith("demoapp2-")) {
          flags[key] = gb.evalFeature(key).value;
        }
      }
      gb.destroy();
    }
  } catch {
    // Continue with empty flags — layout still works with defaults
  }

  // --- Assemble sections ---

  // Hero Banner
  const banners = getBannersForTier(tier);
  const heroMode = (flags["demoapp2-hero-layout"] as string) || "carousel";
  const heroSection = {
    id: "hero",
    component: "HeroBanner" as const,
    visible: true,
    props: {
      banners: heroMode === "single" ? [banners[0]] : banners,
      mode: heroMode as "carousel" | "single" | "member-rewards",
      overlayStyle: (tier === "gold" ? "gold" : "default") as "gold" | "default",
      pillText: isSignedIn
        ? tier === "gold"
          ? "Gold Member Exclusive"
          : tier === "silver"
          ? "Member Picks"
          : "Welcome"
        : "This week\u2019s highlight",
    },
  };

  // Fresh Section
  const freshVisible = flags["demoapp2-fresh-section"] !== false;
  const freshSection = {
    id: "fresh",
    component: "FreshSection" as const,
    visible: freshVisible,
    props: {
      categories: freshCategories,
      rewardsSummary: isSignedIn && tier === "gold"
        ? { points: 847, savedThisMonth: "$24", dealsClipped: 12 }
        : null,
      welcomeMessage: isSignedIn && behavior === "new"
        ? {
            title: "Welcome to Safeway!",
            body: "Start exploring our fresh departments below. Clip deals to save on your first order.",
          }
        : null,
    },
  };

  // Category Grid
  const categoryOrderFlag = flags["demoapp2-category-order"] as string | undefined;
  const sortedCategories = applyCategoryOrdering(attributes, categoryOrderFlag);
  const categorySection = {
    id: "categories",
    component: "CategoryGrid" as const,
    visible: true,
    props: {
      categories: sortedCategories,
      subtitle: isSignedIn ? "Personalized for you" : null,
    },
  };

  // Weekly Deals
  const dealsSort = flags["demoapp2-deals-sort"] as string | undefined;
  const dealsLayout = (flags["demoapp2-deals-layout"] as string) || "scroll";
  const sortedProducts = sortProducts(dealsSort);

  const dealsTitle = isSignedIn && tier === "gold"
    ? "Your Exclusive Deals"
    : isSignedIn && tier === "silver"
    ? "Member Deals"
    : "Weekly Deals";

  const dealsSubtitle = isSignedIn && tier === "gold"
    ? `${sortedProducts.length} Gold-member deals \u00b7 Extra savings unlocked`
    : isSignedIn
    ? `${sortedProducts.length} member deals this week`
    : `${sortedProducts.length} deals this week \u00b7 Updated every Wednesday`;

  const dealsSection = {
    id: "deals",
    component: "WeeklyDeals" as const,
    visible: true,
    props: {
      products: sortedProducts,
      layout: dealsLayout as "scroll" | "grid",
      title: dealsTitle,
      subtitle: dealsSubtitle,
      showUpsell: !isSignedIn,
      memberTier: tier || null,
    },
  };

  const layout: PageLayout = {
    sections: [heroSection, freshSection, categorySection, dealsSection],
  };

  return NextResponse.json(layout, { status: 200 });
}
