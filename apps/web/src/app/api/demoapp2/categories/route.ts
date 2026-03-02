import { NextResponse } from "next/server";
import { groceryCategories } from "@/data/grocery-shop-categories";

export async function GET() {
  return NextResponse.json({ categories: groceryCategories });
}
