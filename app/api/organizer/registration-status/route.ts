import { getOrganizerAccess } from "@/lib/organizer/team";
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

  // 本人の主催者か、TEAM のメンバーとして所属する主催者があれば「登録済み」
  const access = await getOrganizerAccess(supabase, user.id);
  return NextResponse.json(
    { registered: !!access, role: access?.role ?? null },
    { status: 200 }
  );
}

