import { NextResponse } from "next/server";

/**
 * Server-side GrowthBook health probe.
 * The browser cannot call GrowthBook directly (CORS), so the dashboard
 * uses this endpoint to check connectivity from the server.
 */
export async function GET() {
  const apiUrl =
    process.env.GROWTHBOOK_API_URL || "http://localhost:3100";
  const apiKey = process.env.GROWTHBOOK_SECRET_API_KEY || "";

  try {
    const res = await fetch(`${apiUrl}/api/v1/environments`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000),
    });
    return NextResponse.json({ ok: res.ok || res.status === 401 });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
