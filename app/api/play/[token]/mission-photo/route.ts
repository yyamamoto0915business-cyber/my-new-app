import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, uploadPlayMissionPhoto } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";

type Params = { params: Promise<{ token: string }> };

/** POST: ミッションの「写真を投稿」で、撮った写真を送る（送ると達成） */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "写真を選んでください" }, { status: 400 });
  }
  const deviceToken = String(form.get("deviceToken") ?? "");
  const missionIndex = Number(form.get("missionIndex"));

  try {
    const result = await uploadPlayMissionPhoto(
      db,
      token,
      deviceToken,
      Number.isInteger(missionIndex) ? missionIndex : -1,
      file,
      await readPlayUserId(),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ done: true, progress: result.progress });
  } catch (error) {
    console.error("play mission photo POST:", error);
    return NextResponse.json({ error: "写真を送れませんでした" }, { status: 500 });
  }
}
