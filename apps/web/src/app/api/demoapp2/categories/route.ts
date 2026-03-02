import { NextResponse } from "next/server";
import { groceryCategories } from "@/data/safeway-categories";

export async function GET() {
  return NextResponse.json({ categories: groceryCategories });
}
