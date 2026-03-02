import { NextRequest, NextResponse } from "next/server";
import { groceryProducts } from "@/data/grocery-shop-products";

const GB_API_HOST = process.env.GROWTHBOOK_API_HOST || process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || "http://localhost:3100";
const GB_CLIENT_KEY = process.env.GROWTHBOOK_CLIENT_KEY || process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") || "anonymous";
  const category = searchParams.get("category") || undefined;

  // Fetch sort order from Exp Engine SDK endpoint with cache-bust
  let sortOrder = "popularity";
  try {
    const payload = await fetch(
      `${GB_API_HOST}/api/features/${GB_CLIENT_KEY}?_cb=${Date.now()}`
    ).then((r) => r.json());
    sortOrder =
      payload.features?.["demoapp2-deals-sort"]?.defaultValue ?? "popularity";
  } catch {
    // Exp Engine unreachable — use default
  }

  let sorted = [...groceryProducts];

  if (category) {
    sorted = sorted.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sortOrder === "price") {
    sorted.sort((a, b) => {
      const priceA = parseFloat(a.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      const priceB = parseFloat(b.offerPrice.replace(/[^0-9.]/g, "")) || 0;
      return priceA - priceB;
    });
  } else {
    sorted.sort((a, b) => b.popularity - a.popularity);
  }

  return NextResponse.json({
    products: sorted,
    meta: { sortOrder, userId, total: sorted.length },
  });
}
