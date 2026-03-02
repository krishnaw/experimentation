import { NextResponse } from "next/server";
import { listFeatures } from "@/lib/growthbook-api";

export async function GET() {
  try {
    const features = await listFeatures();
    return NextResponse.json(features);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
