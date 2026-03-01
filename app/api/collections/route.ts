import { NextResponse } from "next/server";
import { getAllCollections } from "../../../lib/featured-collections-store";

export async function GET() {
  const collections = getAllCollections();
  return NextResponse.json(collections, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
