import { NextRequest, NextResponse } from "next/server";
import { getPlayDb, uploadPlayPhotoSpot } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { readQuizArrivalProof } from "@/lib/organizer/quiz-arrival";

type Params = { params: Promise<{ token: string }> };

/** POST: フォトラリーで、撮った写真を送る（着いたことを確かめてから記録） */
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
  const spotIndex = Number(form.get("spotIndex"));
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const proof = readQuizArrivalProof({
    here: form.get("lat") != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    keyword: String(form.get("keyword") ?? ""),
  });
  try {
    const result = await uploadPlayPhotoSpot(
      db,
      token,
      String(form.get("deviceToken") ?? ""),
      Number.isInteger(spotIndex) ? spotIndex : -1,
      file,
      await readPlayUserId(),
      proof,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ done: true, progress: result.progress });
  } catch (error) {
    console.error("play photo upload POST:", error);
    return NextResponse.json({ error: "写真を送れませんでした" }, { status: 500 });
  }
}
