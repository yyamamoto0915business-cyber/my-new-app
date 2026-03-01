import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { fetchInboxByQueries } from "@/lib/inbox-queries";
import { fetchInboxDirectDb } from "@/lib/inbox-direct-db";

/** GET: 未読件数合計 */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const items = await fetchInboxDirectDb(user.id);
      const count = items.reduce((sum, i) => sum + (i.unread_count || 0), 0);
      return NextResponse.json({ count });
    } catch {
      // fallback to supabase client
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const items = await fetchInboxByQueries(supabase, user.id);
    const count = items.reduce((sum, i) => sum + (i.unread_count || 0), 0);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
