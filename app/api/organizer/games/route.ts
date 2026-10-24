import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { sanitizeGameExperience } from "@/lib/organizer/game-experience";
import { readGameLook } from "@/lib/organizer/game-look";
import {
  createOrganizerGame,
  listOrganizerGameEventOptions,
  listOrganizerGameSpots,
  listOrganizerGames,
  parseOrganizerGameSpotDrafts,
} from "@/lib/organizer/games";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  getOrganizerGameType,
  isOrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import { MAX_ORGANIZER_GAME_SPOTS } from "@/lib/organizer/game-tokens";
import { sanitizeCheckinSettings } from "@/lib/organizer/checkin";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import { sanitizeCouponSettings } from "@/lib/organizer/coupon";
import { sanitizeMissionSettings } from "@/lib/organizer/mission";
import { sanitizePhotoSettings } from "@/lib/organizer/photo";

function settingsFromBody(body: {
  quiz?: unknown;
  mission?: unknown;
  photo?: unknown;
  coupon?: unknown;
  checkin?: unknown;
  mystery?: unknown;
  experience?: unknown;
  look?: unknown;
  audience?: unknown;
}) {
  const quiz = body.quiz && typeof body.quiz === "object" ? body.quiz : null;
  const mission = sanitizeMissionSettings(body.mission);
  const photo = sanitizePhotoSettings(body.photo);
  const coupon = sanitizeCouponSettings(body.coupon);
  const checkin = sanitizeCheckinSettings(body.checkin);
  const mystery = sanitizeMysterySettings(body.mystery);
  const experience = sanitizeGameExperience(body.experience);
  // 参加画面のアイコンと背景（スタンプラリー以外）。
  const look = body.look && typeof body.look === "object" ? readGameLook(body.look) : null;
  // 参加できる人（スタンプラリー以外）。誰でも以外のときだけ残す。
  const audience = body.audience === "event" || body.audience === "pass" ? body.audience : null;
  if (!quiz && !mission && !photo && !coupon && !checkin && !mystery && !experience && !look) return undefined;
  return {
    ...(quiz ? { quiz } : {}),
    ...(mission ? { mission } : {}),
    ...(photo ? { photo } : {}),
    ...(coupon ? { coupon } : {}),
    ...(checkin ? { checkin } : {}),
    ...(mystery ? { mystery } : {}),
    ...(experience ? { experience } : {}),
    ...(look ? { look } : {}),
    ...(audience ? { audience } : {}),
  };
}

/** GET: ゲーム一覧。events=1 で対象イベント候補も返す */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const includeEvents = request.nextUrl.searchParams.get("events") === "1";
  const includeGames = request.nextUrl.searchParams.get("games") !== "0";

  try {
    if (includeEvents && !includeGames) {
      const events = await listOrganizerGameEventOptions(supabase, organizerId);
      return NextResponse.json({ events });
    }

    const games = await listOrganizerGames(supabase, organizerId);
    if (!includeEvents) {
      return NextResponse.json({ games });
    }
    const events = await listOrganizerGameEventOptions(supabase, organizerId);
    return NextResponse.json({ games, events });
  } catch (e) {
    console.error("organizer games GET:", e);
    return NextResponse.json({ error: "ゲームの取得に失敗しました" }, { status: 500 });
  }
}

/** POST: ゲーム下書きを作成（いまはスタンプラリーのみ） */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  let body: {
    name?: unknown;
    type?: unknown;
    eventId?: unknown;
    description?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
    spots?: unknown;
    status?: unknown;
    quiz?: unknown;
    mission?: unknown;
    photo?: unknown;
    coupon?: unknown;
    checkin?: unknown;
    mystery?: unknown;
    experience?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "ゲーム名は必須です" }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "ゲーム名は80文字以内にしてください" }, { status: 400 });
  }

  const typeRaw = typeof body.type === "string" ? body.type : DEFAULT_ORGANIZER_GAME_TYPE_ID;
  if (!isOrganizerGameTypeId(typeRaw)) {
    return NextResponse.json({ error: "ゲームタイプが不正です" }, { status: 400 });
  }
  const typeMeta = getOrganizerGameType(typeRaw);
  if (!typeMeta.available) {
    return NextResponse.json(
      { error: `${typeMeta.label}は準備中です。いまはスタンプラリー、クイズラリー、謎解き街歩き、ミッション、フォトラリー、クーポンラリー、チェックインを作成できます。` },
      { status: 400 }
    );
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 400) {
    return NextResponse.json({ error: "説明は400文字以内にしてください" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" && body.eventId ? body.eventId : null;
  if (eventId) {
    const { data: event, error } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("organizer_id", organizerId)
      .maybeSingle();
    if (error || !event) {
      return NextResponse.json({ error: "対象イベントが見つかりません" }, { status: 400 });
    }
  }

  const startsAt = typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null;
  const endsAt = typeof body.endsAt === "string" && body.endsAt ? body.endsAt : null;
  if (startsAt && Number.isNaN(Date.parse(startsAt))) {
    return NextResponse.json({ error: "開始日時が不正です" }, { status: 400 });
  }
  if (endsAt && Number.isNaN(Date.parse(endsAt))) {
    return NextResponse.json({ error: "終了日時が不正です" }, { status: 400 });
  }
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    return NextResponse.json({ error: "終了日時は開始日時より後にしてください" }, { status: 400 });
  }

  const parsedSpots = parseOrganizerGameSpotDrafts(body.spots);
  if (!parsedSpots.ok) {
    return NextResponse.json({ error: parsedSpots.error }, { status: 400 });
  }

  try {
    const game = await createOrganizerGame(supabase, organizerId, {
      name,
      type: typeRaw,
      eventId,
      description,
      startsAt,
      endsAt,
      status: body.status === "published" ? "published" : "draft",
      settings: settingsFromBody(body),
      spots: parsedSpots.spots,
    });
    let spots: Awaited<ReturnType<typeof listOrganizerGameSpots>> = [];
    try {
      spots = await listOrganizerGameSpots(supabase, game.id);
    } catch (spotError) {
      console.error("organizer games POST spots:", spotError);
    }
    return NextResponse.json({ game, spots }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "SPOT_LIMIT") {
      return NextResponse.json(
        { error: `スポットは${MAX_ORGANIZER_GAME_SPOTS}件までです` },
        { status: 400 }
      );
    }
    console.error("organizer games POST:", e);
    return NextResponse.json({ error: "ゲームの作成に失敗しました" }, { status: 500 });
  }
}
