import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getApplicationStatus } from "@/lib/db/recruitments-mvp";
import { getStoreApplicationStatus } from "@/lib/created-recruitments-store";

type Params = { params: Promise<{ id: string }> };

/** GET: 現在ユーザーの応募ステータス */
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ status: null }, { status: 200 });
  }

  const { id: recruitmentId } = await params;
  if (!recruitmentId) {
    return NextResponse.json({ status: null }, { status: 400 });
  }

  const supabase = await createClient();

  if (supabase) {
    try {
      const status = await getApplicationStatus(supabase, recruitmentId, user.id);
      return NextResponse.json({ status });
    } catch {
      return NextResponse.json({ status: null }, { status: 500 });
    }
  }

  const status = getStoreApplicationStatus(recruitmentId, user.id);
  return NextResponse.json({ status });
}
