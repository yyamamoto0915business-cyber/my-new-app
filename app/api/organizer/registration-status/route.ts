import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ registered: false }, { status: 200 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { registered: false, error: "db_unavailable" },
      { status: 200 }
    );
  }

  const { data } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return NextResponse.json({ registered: !!data }, { status: 200 });
}

