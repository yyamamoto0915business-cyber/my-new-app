import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/db/notifications";
import { respondFollow } from "@/lib/db/user-follows";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }
  const action = String((body as Record<string, unknown>).action ?? "");
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "action が不正です" }, { status: 400 });
  }

  const row = await respondFollow(
    id,
    user.id,
    action === "accept" ? "accepted" : "rejected",
  );
  if (!row) {
    return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
  }

  if (action === "accept") {
    const supabase = await createClient();
    if (supabase) {
      await createNotification(
        supabase,
        row.follower_id,
        "follow_accepted",
        `${user.name ?? "ユーザー"}さんがフォローを承認しました`,
        {
          body: "非公開のアルバムも見られるようになりました。",
          link: `/users/${user.id}/album`,
        },
      );
    }
  }

  return NextResponse.json({ status: row.status, id: row.id });
}
