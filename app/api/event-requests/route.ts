import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockEventRequests } from "@/lib/db/event-requests";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const city = searchParams.get("city") ?? undefined;

  const supabase = await createClient();
  if (supabase) {
    let query = supabase
      .from("event_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (prefecture) query = query.eq("prefecture", prefecture);
    if (city) query = query.eq("city", city);
    const { data, error } = await query;
    if (!error) return NextResponse.json(data ?? []);
  }

  let list = mockEventRequests.filter((r) => r.status === "open");
  if (prefecture) list = list.filter((r) => r.prefecture === prefecture);
  if (city) list = list.filter((r) => r.city === city);
  return NextResponse.json(list);
}
