import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicPlayAudience, publicPlayLimit, publicPlayStart, type GameAudience, type GamePlayLimit, type PublicPlayStart } from "@/lib/organizer/game-experience";
import { publicQuiz, readStoredQuiz } from "@/lib/organizer/quiz-play";
import { readGameLook } from "@/lib/organizer/game-look";
import { publicMission, readStoredMission } from "@/lib/organizer/mission-play";
import { publicPhoto, readStoredPhoto } from "@/lib/organizer/photo-play";
import { readStoredCoupon } from "@/lib/organizer/coupon-play";
import { publicCheckin, readStoredCheckin } from "@/lib/organizer/checkin-play";
import { publicMystery, readStoredMystery } from "@/lib/organizer/mystery-play";
import { getOrganizerGameType, isOrganizerGameTypeId } from "@/lib/organizer/game-types";
import { playEventEntryHeld, getPlayDb, joinPlayGame, playGamePublished } from "@/lib/organizer/play";
import { readPlayUserId } from "@/lib/organizer/play-user";
import { loadPlayMoment } from "@/lib/organizer/play-moment";

type Params = { params: Promise<{ token: string }> };

type PlayGameRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  starts_at: string | null;
  ends_at: string | null;
  spot_count: number;
};

function formatPlayPeriod(startsAt: string | null, endsAt: string | null): string | null {
  const fmt = (iso: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  const start = fmt(startsAt);
  const end = fmt(endsAt);
  if (start && end) return `${start} 〜 ${end}`;
  if (start) return `${start} から`;
  if (end) return `${end} まで`;
  return null;
}

async function loadPublicStart(gameId: string): Promise<{ start: PublicPlayStart; audience: GameAudience; playLimit: GamePlayLimit }> {
  const blank = { start: publicPlayStart(null), audience: "anyone" as const, playLimit: "once" as const };
  const db = getPlayDb();
  if (!db) return blank;
  const { data, error } = await db.from("organizer_games").select("settings").eq("id", gameId).maybeSingle();
  if (error) {
    console.error("play start settings:", error);
    return blank;
  }
  const settings = (data as { settings?: unknown } | null)?.settings;
  return {
    start: publicPlayStart(settings),
    audience: publicPlayAudience(settings),
    playLimit: publicPlayLimit(settings),
  };
}

/** GET: 参加用QRの公開情報 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("get_play_game_by_join_token", {
    p_token: token,
  });
  if (error) {
    console.error("play game GET:", error);
    return NextResponse.json({ error: "ゲームの取得に失敗しました" }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as PlayGameRow | null;
  if (!row?.id) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }
  const playDb = getPlayDb();
  if (playDb && !(await playGamePublished(playDb, row.id))) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const type = isOrganizerGameTypeId(row.type) ? row.type : "stamp";
  const userId = await readPlayUserId();
  let accountNickname: string | null = null;
  if (userId && playDb) {
    const { data: owned } = await playDb
      .from("organizer_game_players")
      .select("nickname")
      .eq("game_id", row.id)
      .eq("account_user_id", userId)
      .maybeSingle();
    if (typeof owned?.nickname === "string" && owned.nickname.trim()) {
      accountNickname = owned.nickname;
    }
  }
  const [opening, moment] = await Promise.all([loadPublicStart(row.id), loadPlayMoment(row.id)]);
  const start = opening.start;
  // スタンプラリー以外は、設定（問題・お題など）を一度だけ読む。
  let settings: unknown = null;
  if (type !== "stamp" && playDb) {
    const { data: settingsRow } = await playDb.from("organizer_games").select("settings").eq("id", row.id).maybeSingle();
    settings = (settingsRow as { settings?: unknown } | null)?.settings ?? null;
  }
  let quiz = null;
  if (type === "quiz") {
    const stored = readStoredQuiz(settings);
    quiz = stored ? publicQuiz(stored) : null;
  }
  let mission = null;
  if (type === "mission") {
    const storedMission = readStoredMission(settings);
    const hints =
      !!settings &&
      typeof settings === "object" &&
      !Array.isArray(settings) &&
      typeof (settings as { mission?: { publish?: { hints?: unknown } } }).mission?.publish?.hints === "boolean"
        ? (settings as { mission: { publish: { hints: boolean } } }).mission.publish.hints
        : true;
    mission = storedMission ? publicMission(storedMission, hints) : null;
  }
  const storedPhoto = type === "photo" ? readStoredPhoto(settings) : null;
  const photo = storedPhoto ? publicPhoto(storedPhoto) : null;
  const coupon = type === "coupon" ? readStoredCoupon(settings) : null;
  let checkin = null;
  if (type === "checkin") {
    const storedCheckin = readStoredCheckin(settings);
    checkin = storedCheckin ? publicCheckin(storedCheckin) : null;
  }
  let mystery = null;
  if (type === "mystery") {
    const storedMystery = readStoredMystery(settings);
    mystery = storedMystery ? publicMystery(storedMystery) : null;
  }
  const look =
    type !== "stamp" && settings && typeof settings === "object"
      ? readGameLook((settings as { look?: unknown }).look)
      : null;
  return NextResponse.json({
    name: row.name,
    description: row.description ?? "",
    type,
    typeLabel: getOrganizerGameType(type).label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    spotCount: row.spot_count ?? 0,
    audience: opening.audience,
    playLimit: opening.playLimit,
    signedIn: Boolean(userId),
    accountNickname,
    // 対象イベントに申し込んだアカウントは、ニックネーム・合言葉なしで参加できる（スタンプラリー以外）。
    eventEntry: type !== "stamp" && playDb ? await playEventEntryHeld(playDb, row.id, userId) : false,
    start: {
      ...start,
      periodLabel: start.showPeriod ? formatPlayPeriod(row.starts_at, row.ends_at) : null,
    },
    moment,
    quiz,
    mission,
    photo,
    coupon,
    checkin,
    mystery,
    look,
  });
}

/** POST: ニックネーム＋合言葉で参加／再開 */
export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "ゲームが見つかりません" }, { status: 404 });
  }

  const db = getPlayDb();
  if (!db) {
    return NextResponse.json({ error: "参加処理を開始できません" }, { status: 503 });
  }

  let body: { nickname?: unknown; passphrase?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname : "";
  const passphrase = typeof body.passphrase === "string" ? body.passphrase : "";

  try {
    const result = await joinPlayGame(db, token, nickname, passphrase, await readPlayUserId());
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code ?? null }, { status: result.status });
    }
    return NextResponse.json(result.session);
  } catch (e) {
    console.error("play join POST:", e);
    return NextResponse.json({ error: "参加に失敗しました" }, { status: 500 });
  }
}
