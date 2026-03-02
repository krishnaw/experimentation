import { describe, it, expect, vi, afterEach } from "vitest";
import type { PageLayout } from "@/lib/layout-types";

function mockFeaturesFetch(features: Record<string, any>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features }),
  });
}

const DEMOAPP2_FEATURES = {
  "demoapp2-hero-layout": { defaultValue: "carousel" },
  "demoapp2-deals-sort": { defaultValue: "popularity" },
  "demoapp2-deals-layout": { defaultValue: "scroll" },
  "demoapp2-fresh-section": { defaultValue: true },
  "demoapp2-category-order": { defaultValue: "default" },
};

async function postLayout(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/demoapp2/layout/route");
  const { NextRequest } = await import("next/server");
  const req = new NextRequest("http://localhost:3050/api/demoapp2/layout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return POST(req);
}

describe("POST /api/demoapp2/layout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 4 sections for anonymous user", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    expect(res.status).toBe(200);
    expect(body.sections).toHaveLength(4);
    expect(body.sections.map((s) => s.component)).toEqual([
      "HeroBanner",
      "FreshSection",
      "CategoryGrid",
      "WeeklyDeals",
    ]);
  });

  it("returns default hero banners for anonymous user", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    const hero = body.sections.find((s) => s.component === "HeroBanner")!;
    expect(hero.visible).toBe(true);
    const props = hero.props as any;
    expect(props.banners).toHaveLength(3); // 3 default banners
    expect(props.overlayStyle).toBe("default");
    expect(props.pillText).toBe("This week\u2019s highlight");
    expect(props.mode).toBe("carousel");
  });

  it("returns gold-specific hero for gold member", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "sarah-chen",
      attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" },
    });
    const body: PageLayout = await res.json();

    const hero = body.sections.find((s) => s.component === "HeroBanner")!;
    const props = hero.props as any;
    expect(props.overlayStyle).toBe("gold");
    expect(props.pillText).toBe("Gold Member Exclusive");
    expect(props.banners.length).toBeGreaterThan(0);
    expect(props.banners[0].segment).toBe("gold");
  });

  it("returns silver-specific hero for silver member", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "marcus-johnson",
      attributes: { membership_tier: "silver", location: "NY", shopping_behavior: "occasional", household_type: "couple" },
    });
    const body: PageLayout = await res.json();

    const hero = body.sections.find((s) => s.component === "HeroBanner")!;
    const props = hero.props as any;
    expect(props.overlayStyle).toBe("default");
    expect(props.pillText).toBe("Member Picks");
  });

  it("returns rewards summary for gold member in FreshSection", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "sarah-chen",
      attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" },
    });
    const body: PageLayout = await res.json();

    const fresh = body.sections.find((s) => s.component === "FreshSection")!;
    const props = fresh.props as any;
    expect(props.rewardsSummary).toEqual({ points: 847, savedThisMonth: "$24", dealsClipped: 12 });
    expect(props.welcomeMessage).toBeNull();
  });

  it("returns welcome message for new shopper in FreshSection", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "emily-rodriguez",
      attributes: { membership_tier: "basic", location: "IL", shopping_behavior: "new", household_type: "single" },
    });
    const body: PageLayout = await res.json();

    const fresh = body.sections.find((s) => s.component === "FreshSection")!;
    const props = fresh.props as any;
    expect(props.rewardsSummary).toBeNull();
    expect(props.welcomeMessage).toBeTruthy();
    expect(props.welcomeMessage.title).toContain("Welcome");
  });

  it("returns no rewards/welcome for anonymous user", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    const fresh = body.sections.find((s) => s.component === "FreshSection")!;
    const props = fresh.props as any;
    expect(props.rewardsSummary).toBeNull();
    expect(props.welcomeMessage).toBeNull();
    expect(props.categories).toHaveLength(4);
  });

  it("returns personalized category subtitle for signed-in user", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "sarah-chen",
      attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" },
    });
    const body: PageLayout = await res.json();

    const cats = body.sections.find((s) => s.component === "CategoryGrid")!;
    const props = cats.props as any;
    expect(props.subtitle).toBe("Personalized for you");
    expect(props.categories.length).toBe(16);
  });

  it("returns null category subtitle for anonymous user", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    const cats = body.sections.find((s) => s.component === "CategoryGrid")!;
    const props = cats.props as any;
    expect(props.subtitle).toBeNull();
  });

  it("returns gold-specific deals section for gold member", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "sarah-chen",
      attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" },
    });
    const body: PageLayout = await res.json();

    const deals = body.sections.find((s) => s.component === "WeeklyDeals")!;
    const props = deals.props as any;
    expect(props.title).toBe("Your Exclusive Deals");
    expect(props.subtitle).toContain("Gold-member deals");
    expect(props.showUpsell).toBe(false);
    expect(props.memberTier).toBe("gold");
    expect(props.products.length).toBeGreaterThan(0);
  });

  it("returns upsell for anonymous user in deals section", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    const deals = body.sections.find((s) => s.component === "WeeklyDeals")!;
    const props = deals.props as any;
    expect(props.title).toBe("Weekly Deals");
    expect(props.showUpsell).toBe(true);
    expect(props.memberTier).toBeNull();
  });

  it("returns 400 for invalid JSON body", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const { POST } = await import("@/app/api/demoapp2/layout/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://localhost:3050/api/demoapp2/layout", {
      method: "POST",
      body: "this is not json{{{",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns layout with defaults when GrowthBook is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    // Should still return a valid layout, just with default flag values
    expect(res.status).toBe(200);
    expect(body.sections).toHaveLength(4);
    const hero = body.sections.find((s) => s.component === "HeroBanner")!;
    expect((hero.props as any).mode).toBe("carousel"); // default
  });

  it("sorts products by popularity by default", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({});
    const body: PageLayout = await res.json();

    const deals = body.sections.find((s) => s.component === "WeeklyDeals")!;
    const products = (deals.props as any).products;
    for (let i = 1; i < products.length; i++) {
      expect(products[i - 1].popularity).toBeGreaterThanOrEqual(products[i].popularity);
    }
  });

  it("reorders categories for frequent shoppers", async () => {
    vi.stubGlobal("fetch", mockFeaturesFetch(DEMOAPP2_FEATURES));
    const res = await postLayout({
      userId: "sarah-chen",
      attributes: { membership_tier: "gold", location: "CA", shopping_behavior: "frequent", household_type: "family" },
    });
    const body: PageLayout = await res.json();

    const cats = body.sections.find((s) => s.component === "CategoryGrid")!;
    const catIds = (cats.props as any).categories.map((c: any) => c.id);
    // Frequent shoppers should see meat near the top
    expect(catIds.indexOf("meat")).toBeLessThan(catIds.indexOf("pantry"));
  });
});
