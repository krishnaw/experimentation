import type { HeroBanner } from "@/data/safeway-banners";
import type { GroceryCategory } from "@/data/safeway-categories";
import type { GroceryProduct } from "@/data/safeway-products";

export interface HeroBannerSectionProps {
  banners: HeroBanner[];
  mode: "carousel" | "single" | "member-rewards";
  overlayStyle: "default" | "gold";
  pillText: string;
}

export interface FreshCategory {
  name: string;
  subtitle: string;
  icon: string;
  image: string;
}

export interface FreshSectionProps {
  categories: FreshCategory[];
  rewardsSummary: {
    points: number;
    savedThisMonth: string;
    dealsClipped: number;
  } | null;
  welcomeMessage: { title: string; body: string } | null;
}

export interface CategoryGridSectionProps {
  categories: GroceryCategory[];
  subtitle: string | null;
}

export interface WeeklyDealsSectionProps {
  products: GroceryProduct[];
  layout: "scroll" | "grid";
  title: string;
  subtitle: string;
  showUpsell: boolean;
  memberTier: string | null;
}

export type SectionComponent =
  | "HeroBanner"
  | "FreshSection"
  | "CategoryGrid"
  | "WeeklyDeals";

export type SectionProps =
  | HeroBannerSectionProps
  | FreshSectionProps
  | CategoryGridSectionProps
  | WeeklyDealsSectionProps;

export interface LayoutSection {
  id: string;
  component: SectionComponent;
  visible: boolean;
  props: SectionProps;
}

export interface PageLayout {
  sections: LayoutSection[];
}
