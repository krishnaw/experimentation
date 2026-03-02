import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const COMPONENTS_DIR = path.resolve(__dirname, "../components/demoapp2");

function readComponent(name: string): string {
  return fs.readFileSync(path.join(COMPONENTS_DIR, name), "utf-8");
}

describe("SDUI components are pure renderers", () => {
  const sduiComponents = [
    "HeroBanner.tsx",
    "FreshSection.tsx",
    "CategoryGrid.tsx",
    "WeeklyDeals.tsx",
  ];

  for (const file of sduiComponents) {
    describe(file, () => {
      it("does not import useUser context", () => {
        const src = readComponent(file);
        expect(src).not.toContain("useUser");
        expect(src).not.toMatch(/from\s+["']@\/contexts\/UserContext["']/);
      });

      it("does not import useFeatureValue or useFeatureIsOn", () => {
        const src = readComponent(file);
        expect(src).not.toContain("useFeatureValue");
        expect(src).not.toContain("useFeatureIsOn");
        expect(src).not.toMatch(/from\s+["']@growthbook\/growthbook-react["']/);
      });

      it("does not reference remoteFeatures", () => {
        const src = readComponent(file);
        expect(src).not.toContain("remoteFeatures");
      });
    });
  }

  describe("HeroBanner", () => {
    it("accepts HeroBannerSectionProps from layout-types", () => {
      const src = readComponent("HeroBanner.tsx");
      expect(src).toContain("HeroBannerSectionProps");
      expect(src).toMatch(/from\s+["']@\/lib\/layout-types["']/);
    });

    it("does not import getBannersForTier", () => {
      const src = readComponent("HeroBanner.tsx");
      expect(src).not.toContain("getBannersForTier");
    });
  });

  describe("FreshSection", () => {
    it("accepts FreshSectionProps from layout-types", () => {
      const src = readComponent("FreshSection.tsx");
      expect(src).toContain("FreshSectionProps");
      expect(src).toMatch(/from\s+["']@\/lib\/layout-types["']/);
    });

    it("renders rewardsSummary from props (not computed)", () => {
      const src = readComponent("FreshSection.tsx");
      // Should use prop directly, not compute from tier
      expect(src).not.toContain("tier === \"gold\"");
      expect(src).toContain("rewardsSummary");
    });
  });

  describe("CategoryGrid", () => {
    it("accepts CategoryGridSectionProps from layout-types", () => {
      const src = readComponent("CategoryGrid.tsx");
      expect(src).toContain("CategoryGridSectionProps");
      expect(src).toMatch(/from\s+["']@\/lib\/layout-types["']/);
    });

    it("does not contain category ordering logic", () => {
      const src = readComponent("CategoryGrid.tsx");
      expect(src).not.toContain("categoryOrderByBehavior");
      expect(src).not.toContain("categoryBoostByHousehold");
      expect(src).not.toContain("orderedCategories");
    });

    it("does not import groceryCategories data", () => {
      const src = readComponent("CategoryGrid.tsx");
      expect(src).not.toMatch(/from\s+["']@\/data\/safeway-categories["']/);
    });
  });

  describe("WeeklyDeals", () => {
    it("accepts WeeklyDealsSectionProps from layout-types", () => {
      const src = readComponent("WeeklyDeals.tsx");
      expect(src).toContain("WeeklyDealsSectionProps");
      expect(src).toMatch(/from\s+["']@\/lib\/layout-types["']/);
    });

    it("does not compute section title from tier", () => {
      const src = readComponent("WeeklyDeals.tsx");
      // Should not have tier-based title computation
      expect(src).not.toContain("\"Your Exclusive Deals\"");
      expect(src).not.toContain("\"Member Deals\"");
    });

    it("uses memberTier prop for MemberPriceBadge", () => {
      const src = readComponent("WeeklyDeals.tsx");
      expect(src).toContain("memberTier");
    });
  });

  describe("DemoApp2 page", () => {
    it("does not use useFeatureValue or useFeatureIsOn", () => {
      const pageSrc = fs.readFileSync(
        path.resolve(__dirname, "../app/demoapp2/page.tsx"),
        "utf-8"
      );
      expect(pageSrc).not.toContain("useFeatureValue");
      expect(pageSrc).not.toContain("useFeatureIsOn");
      expect(pageSrc).not.toMatch(/from\s+["']@growthbook\/growthbook-react["']/);
    });

    it("uses layout from useUser context", () => {
      const pageSrc = fs.readFileSync(
        path.resolve(__dirname, "../app/demoapp2/page.tsx"),
        "utf-8"
      );
      expect(pageSrc).toContain("layout");
      expect(pageSrc).toContain("loadingLayout");
      expect(pageSrc).toContain("useUser");
    });

    it("uses renderSection for layout-driven rendering", () => {
      const pageSrc = fs.readFileSync(
        path.resolve(__dirname, "../app/demoapp2/page.tsx"),
        "utf-8"
      );
      expect(pageSrc).toContain("renderSection");
    });
  });
});
