export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaClickedText: string;
  image: string;
  bgColor: string;
  /** Which segment variant this banner belongs to (undefined = default/generic) */
  segment?: "gold" | "silver" | "basic" | "club-upsell";
}

/** Default banners shown to non-signed-in users and as fallback */
export const heroBanners: HeroBanner[] = [
  {
    id: "banner-1",
    title: "Fresh Savings Every Week",
    subtitle: "Up to 40% off on select produce, dairy, and bakery items",
    ctaText: "Shop Deals",
    ctaClickedText: "Thanks for stopping by! \ud83d\uded2",
    image: "/images/demoapp2/banners/banner-fresh.jpg",
    bgColor: "#1a1a1a",
  },
  {
    id: "banner-2",
    title: "Summer Grilling Season",
    subtitle: "Premium cuts, marinades, and sides for the perfect cookout",
    ctaText: "Shop Grilling",
    ctaClickedText: "Welcome to the cookout! \ud83c\udf56",
    image: "/images/demoapp2/banners/banner-grilling.jpg",
    bgColor: "#1a1a1a",
  },
  {
    id: "banner-3",
    title: "Organic & Natural",
    subtitle: "Discover our expanding selection of organic favorites",
    ctaText: "Explore Organic",
    ctaClickedText: "Glad you're here! \ud83e\udd66",
    image: "/images/demoapp2/banners/banner-organic.jpg",
    bgColor: "#1a1a1a",
  },
];

/** Segment-specific banners — shown based on persona attributes */
export const segmentBanners: Record<string, HeroBanner[]> = {
  /** Gold members see exclusive rewards banners */
  gold: [
    {
      id: "banner-gold-rewards",
      title: "Your Gold Member Rewards",
      subtitle: "Exclusive savings just for you \u2014 up to 60% off premium items this week",
      ctaText: "View My Rewards",
      ctaClickedText: "Rewards unlocked! \u2b50",
      image: "/images/demoapp2/banners/banner-fresh.jpg",
      bgColor: "#92600a",
      segment: "gold",
    },
    {
      id: "banner-gold-premium",
      title: "Gold Exclusive: Premium Selection",
      subtitle: "First access to limited-edition products and seasonal favorites",
      ctaText: "Shop Exclusives",
      ctaClickedText: "Great choice! \ud83c\udf1f",
      image: "/images/demoapp2/banners/banner-grilling.jpg",
      bgColor: "#92600a",
      segment: "gold",
    },
  ],
  /** Silver members see seasonal promotions */
  silver: [
    {
      id: "banner-silver-seasonal",
      title: "Silver Member Seasonal Picks",
      subtitle: "Curated deals on seasonal favorites \u2014 save up to 35% this week",
      ctaText: "Shop Seasonal",
      ctaClickedText: "Great picks! \ud83c\udf3f",
      image: "/images/demoapp2/banners/banner-organic.jpg",
      bgColor: "#4a4a4a",
      segment: "silver",
    },
    {
      id: "banner-silver-upgrade",
      title: "Upgrade to Gold \u2014 Save More",
      subtitle: "Gold members save an extra 25% on top of member pricing",
      ctaText: "Learn More",
      ctaClickedText: "We'll be in touch! \ud83d\udce7",
      image: "/images/demoapp2/banners/banner-fresh.jpg",
      bgColor: "#4a4a4a",
      segment: "silver",
    },
  ],
  /** Basic / new members see onboarding banners */
  basic: [
    {
      id: "banner-basic-welcome",
      title: "Welcome to Grocery Shop Club!",
      subtitle: "Start saving today \u2014 members get exclusive deals every week",
      ctaText: "Explore Deals",
      ctaClickedText: "Welcome aboard! \ud83c\udf89",
      image: "/images/demoapp2/banners/banner-fresh.jpg",
      bgColor: "#1a3a5c",
      segment: "club-upsell",
    },
  ],
};

/**
 * Get the appropriate banners for a given membership tier.
 * Returns segment-specific banners if available, else default banners.
 */
export function getBannersForTier(tier: string | undefined): HeroBanner[] {
  if (tier && segmentBanners[tier]) {
    return segmentBanners[tier];
  }
  return heroBanners;
}
