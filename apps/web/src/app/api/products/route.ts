import { NextRequest, NextResponse } from "next/server";
import { apiProducts } from "@/data/api-products";

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
      payload.features?.["product-sort-order"]?.defaultValue ?? "popularity";
  } catch {
    // Exp Engine unreachable — use default
  }

  let sorted = [...apiProducts];

  if (category) {
    sorted = sorted.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (sortOrder === "price") {
    sorted.sort((a, b) => a.price - b.price);
  } else {
    sorted.sort((a, b) => b.popularity - a.popularity);
  }

  return NextResponse.json({
    products: sorted,
    meta: { sortOrder, userId, total: sorted.length },
  });
}
