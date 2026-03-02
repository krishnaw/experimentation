import { NextResponse } from "next/server";
import { listExperiments } from "@/lib/growthbook-api";

export async function GET() {
  try {
    const experiments = await listExperiments();
    return NextResponse.json(experiments);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
