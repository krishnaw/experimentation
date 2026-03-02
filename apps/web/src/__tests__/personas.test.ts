import { describe, it, expect } from "vitest";
import { personas, tierColors } from "@/lib/personas";
import {
  heroBanners,
  segmentBanners,
  getBannersForTier,
} from "@/data/grocery-shop-banners";

describe("personas", () => {
  it("has exactly 6 entries", () => {
    expect(personas).toHaveLength(6);
  });

  it("every persona has required fields", () => {
    for (const p of personas) {
      expect(typeof p.id).toBe("string");
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.name).toBe("string");
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.avatar).toBe("string");
      expect(p.avatar.length).toBeGreaterThan(0);
      expect(typeof p.description).toBe("string");
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.attributes).toBeDefined();
      expect(typeof p.attributes).toBe("object");
    }
  });

  it("has no duplicate persona IDs", () => {
    const ids = personas.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every persona has all 4 attribute dimensions", () => {
    for (const p of personas) {
      expect(p.attributes).toHaveProperty("membership_tier");
      expect(p.attributes).toHaveProperty("location");
      expect(p.attributes).toHaveProperty("shopping_behavior");
      expect(p.attributes).toHaveProperty("household_type");
    }
  });

  it("every persona membership_tier is one of gold/silver/basic", () => {
    const validTiers = ["gold", "silver", "basic"];
    for (const p of personas) {
      expect(validTiers).toContain(p.attributes.membership_tier);
    }
  });

  it("every persona shopping_behavior is one of frequent/occasional/new", () => {
    const validBehaviors = ["frequent", "occasional", "new"];
    for (const p of personas) {
      expect(validBehaviors).toContain(p.attributes.shopping_behavior);
    }
  });

  it("every persona household_type is one of family/couple/single/senior", () => {
    const validTypes = ["family", "couple", "single", "senior"];
    for (const p of personas) {
      expect(validTypes).toContain(p.attributes.household_type);
    }
  });

  it("every persona location is a non-empty string", () => {
    for (const p of personas) {
      expect(typeof p.attributes.location).toBe("string");
      expect(p.attributes.location.length).toBeGreaterThan(0);
    }
  });
});

describe("tierColors", () => {
  it("has entries for gold, silver, and basic", () => {
    expect(tierColors).toHaveProperty("gold");
    expect(tierColors).toHaveProperty("silver");
    expect(tierColors).toHaveProperty("basic");
  });

  it("every tier color entry has bg, text, and label fields", () => {
    for (const tier of ["gold", "silver", "basic"] as const) {
      const entry = tierColors[tier];
      expect(typeof entry.bg).toBe("string");
      expect(entry.bg.length).toBeGreaterThan(0);
      expect(typeof entry.text).toBe("string");
      expect(entry.text.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("tier labels match their tier names (case-insensitive)", () => {
    expect(tierColors.gold.label.toLowerCase()).toBe("gold");
    expect(tierColors.silver.label.toLowerCase()).toBe("silver");
    expect(tierColors.basic.label.toLowerCase()).toBe("basic");
  });
});

describe("heroBanners", () => {
  it("has exactly 3 entries", () => {
    expect(heroBanners).toHaveLength(3);
  });

  it("every banner has required fields", () => {
    for (const b of heroBanners) {
      expect(typeof b.id).toBe("string");
      expect(b.id.length).toBeGreaterThan(0);
      expect(typeof b.title).toBe("string");
      expect(b.title.length).toBeGreaterThan(0);
      expect(typeof b.subtitle).toBe("string");
      expect(b.subtitle.length).toBeGreaterThan(0);
      expect(typeof b.ctaText).toBe("string");
      expect(b.ctaText.length).toBeGreaterThan(0);
      expect(typeof b.ctaClickedText).toBe("string");
      expect(b.ctaClickedText.length).toBeGreaterThan(0);
      expect(typeof b.image).toBe("string");
      expect(b.image.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate banner IDs across heroBanners and segmentBanners", () => {
    const heroBannerIds = heroBanners.map((b) => b.id);
    const segmentBannerIds = Object.values(segmentBanners)
      .flat()
      .map((b) => b.id);
    const allIds = [...heroBannerIds, ...segmentBannerIds];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});

describe("segmentBanners", () => {
  it("has entries for gold, silver, and basic", () => {
    expect(segmentBanners).toHaveProperty("gold");
    expect(segmentBanners).toHaveProperty("silver");
    expect(segmentBanners).toHaveProperty("basic");
  });

  it("each segment has at least 1 banner", () => {
    for (const segment of ["gold", "silver", "basic"]) {
      expect(Array.isArray(segmentBanners[segment])).toBe(true);
      expect(segmentBanners[segment].length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every segment banner has required fields", () => {
    for (const banners of Object.values(segmentBanners)) {
      for (const b of banners) {
        expect(typeof b.id).toBe("string");
        expect(b.id.length).toBeGreaterThan(0);
        expect(typeof b.title).toBe("string");
        expect(b.title.length).toBeGreaterThan(0);
        expect(typeof b.subtitle).toBe("string");
        expect(b.subtitle.length).toBeGreaterThan(0);
        expect(typeof b.ctaText).toBe("string");
        expect(b.ctaText.length).toBeGreaterThan(0);
        expect(typeof b.ctaClickedText).toBe("string");
        expect(b.ctaClickedText.length).toBeGreaterThan(0);
        expect(typeof b.image).toBe("string");
        expect(b.image.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("getBannersForTier", () => {
  it("returns gold segment banners for tier 'gold'", () => {
    const result = getBannersForTier("gold");
    expect(result).toBe(segmentBanners["gold"]);
    expect(result).toHaveLength(segmentBanners["gold"].length);
  });

  it("returns silver segment banners for tier 'silver'", () => {
    const result = getBannersForTier("silver");
    expect(result).toBe(segmentBanners["silver"]);
    expect(result).toHaveLength(segmentBanners["silver"].length);
  });

  it("returns basic segment banners for tier 'basic'", () => {
    const result = getBannersForTier("basic");
    expect(result).toBe(segmentBanners["basic"]);
    expect(result).toHaveLength(segmentBanners["basic"].length);
  });

  it("returns default heroBanners when tier is undefined", () => {
    const result = getBannersForTier(undefined);
    expect(result).toBe(heroBanners);
    expect(result).toHaveLength(heroBanners.length);
  });

  it("returns default heroBanners for an unrecognised tier string", () => {
    const result = getBannersForTier("nonexistent");
    expect(result).toBe(heroBanners);
    expect(result).toHaveLength(heroBanners.length);
  });

  it("returns default heroBanners for an empty string tier", () => {
    const result = getBannersForTier("");
    expect(result).toBe(heroBanners);
    expect(result).toHaveLength(heroBanners.length);
  });
});
