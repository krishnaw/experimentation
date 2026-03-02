import { NextRequest, NextResponse } from "next/server";
import { GrowthBook } from "@growthbook/growthbook";

const GB_API_HOST =
  process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || "http://localhost:3100";
const GB_CLIENT_KEY =
  process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || "sdk-placeholder";

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
  const attributes = body.attributes || {};

  // Fetch features payload manually with cache-busting
  let payload;
  try {
    const url = `${GB_API_HOST}/api/features/${GB_CLIENT_KEY}?_cb=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    payload = await res.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch features from GrowthBook", detail: String(e) },
      { status: 502 }
    );
  }

  const gb = new GrowthBook({
    apiHost: GB_API_HOST,
    clientKey: GB_CLIENT_KEY,
  });

  await gb.setPayload(payload);
  gb.setAttributes({ id: userId, ...attributes });

  // Get all loaded feature definitions and filter to demoapp2-* keys
  const allFeatures = gb.getFeatures();
  const demoapp2Keys = Object.keys(allFeatures).filter((k) =>
    k.startsWith("demoapp2-")
  );

  // Evaluate each feature for this user/attributes — only return computed values
  const features: Record<string, unknown> = {};
  for (const key of demoapp2Keys) {
    const result = gb.evalFeature(key);
    features[key] = result.value;
  }

  gb.destroy();

  return NextResponse.json({ features }, { status: 200 });
}
