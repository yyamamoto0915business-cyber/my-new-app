import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { listBlockedUsers } from "@/lib/db/moderation";

/** GET: 自分がブロックしている人の一覧 */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const users = await listBlockedUsers(user.id);
  return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}
