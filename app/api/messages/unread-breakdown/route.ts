import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";

/** GET: 未読内訳（ボランティア/参加者）- 主催モード用 */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ volunteer: 0, participant: 0 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ volunteer: 0, participant: 0 });
  }

  try {
    const { data, error } = await supabase.rpc("get_unread_breakdown");
    if (error) {
      return NextResponse.json({ volunteer: 0, participant: 0 });
    }
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      volunteer: Number(row?.volunteer_count ?? 0) || 0,
      participant: Number(row?.participant_count ?? 0) || 0,
    });
  } catch {
    return NextResponse.json({ volunteer: 0, participant: 0 });
  }
}
