import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mockEvents } from "../../../lib/events-mock";
import { getCreatedEvents } from "../../../lib/created-events-store";
import { filterEventsByRegion, filterEventsByTags } from "../../../lib/events";
import { fetchEvents } from "../../../lib/db/events";

function getFallbackEvents() {
  return [...mockEvents, ...getCreatedEvents()];
}

/** クライアントから来る日付文字列を ISO に正規化。不正値は undefined（例外にしない） */
function safeRegistrationDeadlineIso(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** API レスポンス用にユーザー向けメッセージへ変換（詳細はサーバーログへ） */
function toPublicEventCreateError(err: unknown): string {
  const raw =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes("permission denied") || lower.includes("rls") || lower.includes("row-level security")) {
    return "保存が許可されませんでした。ログインし直してからお試しください。";
  }
  if (lower.includes("foreign key") || lower.includes("violates foreign key")) {
    return "主催者データとの関連付けに失敗しました。主催者登録を確認してください。";
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "同じ内容の登録が既に存在する可能性があります。";
  }
  if (lower.includes("null value") || lower.includes("not null")) {
    return "必須項目がデータベースで満たされていません。入力内容を確認してください。";
  }
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}

function toJstTimestamp(dateYmd: string, timeHm: string): number | null {
  const d = String(dateYmd ?? "").trim();
  const t = String(timeHm ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const ts = Date.parse(`${d}T${t}:00+09:00`);
  return Number.isNaN(ts) ? null : ts;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefecture = searchParams.get("prefecture") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  const supabase = await createClient();
  let result;

  const isProduction = process.env.NODE_ENV === "production";

  if (supabase) {
    try {
      const dbEvents = await fetchEvents(supabase);
      // 本番環境では mock / created ストアには絶対にフォールバックしない
      if (isProduction) {
        result = dbEvents;
      } else {
        result = dbEvents.length > 0 ? dbEvents : getFallbackEvents();
      }
    } catch (e) {
      console.error("events GET:", e);
      result = isProduction ? [] : getFallbackEvents();
    }
  } else {
    result = isProduction ? [] : getFallbackEvents();
  }

  result = filterEventsByRegion(result, prefecture, city);
  result = filterEventsByTags(result, tags);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      imageUrl,
      description,
      date,
      startTime,
      endTime,
      location,
      address,
      price,
      priceNote,
      organizerName,
      organizerContact,
      rainPolicy,
      itemsToBring,
      access,
      childFriendly,
      prefecture,
      city,
      area,
      tags,
      sponsorTicketPrices,
      sponsorPerks,
      prioritySlots,
      englishGuideAvailable,
      capacity,
      requiresRegistration,
      participationMode,
      registrationDeadline,
      registrationNote,
    } = body;

    if (!title?.trim() || !description?.trim() || !date || !startTime || !location?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "タイトル・説明・日付・開始時刻・場所・住所は必須です" },
        { status: 400 }
      );
    }

    const startTs = toJstTimestamp(String(date), String(startTime));
    if (startTs == null) {
      return NextResponse.json(
        { error: "日付または開始時刻の形式が正しくありません" },
        { status: 400 }
      );
    }
    if (startTs < Date.now()) {
      return NextResponse.json(
        { error: "過去の日時のイベントは作成できません" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { getApiUser } = await import("../../../lib/api-auth");
    const { getOrganizerIdByProfileId } = await import("../../../lib/db/recruitments-mvp");
    const { createEvent } = await import("../../../lib/db/events");
    const { addCreatedEvent } = await import("../../../lib/created-events-store");
    const { addDefaultVolunteerRoleForEvent } = await import(
      "../../../lib/created-volunteer-roles-store"
    );
    const { setOrganizerForCreatedEvent } = await import(
      "../../../lib/event-organizers"
    );

    const formData = {
      title: String(title).trim(),
      imageUrl: imageUrl?.trim() || null,
      description: String(description).trim(),
      date: String(date),
      startTime: String(startTime),
      endTime: endTime ? String(endTime) : undefined,
      location: String(location).trim(),
      address: String(address).trim(),
      price: Number(price) || 0,
      priceNote: priceNote?.trim() || undefined,
      organizerName: String(organizerName || "").trim(),
      organizerContact: organizerContact?.trim() || undefined,
      rainPolicy: rainPolicy?.trim() || undefined,
      itemsToBring: Array.isArray(itemsToBring) ? itemsToBring : [],
      access: access?.trim() || undefined,
      childFriendly: Boolean(childFriendly),
      prefecture: prefecture?.trim() || undefined,
      city: city?.trim() || undefined,
      area: area?.trim() || undefined,
      tags: Array.isArray(tags) ? tags : [],
      sponsorTicketPrices: Array.isArray(sponsorTicketPrices) ? sponsorTicketPrices : [],
      sponsorPerks: sponsorPerks && typeof sponsorPerks === "object" ? sponsorPerks : {},
      prioritySlots: Number(prioritySlots) || 0,
      englishGuideAvailable: Boolean(englishGuideAvailable),
      capacity: capacity != null ? Number(capacity) : undefined,
      requiresRegistration:
        (participationMode === "required" ||
          requiresRegistration === true ||
          requiresRegistration === "true" ||
          String(requiresRegistration).toLowerCase() === "true"),
      participationMode:
        participationMode === "required" ||
        participationMode === "optional" ||
        participationMode === "none"
          ? participationMode
          : requiresRegistration
            ? "required"
            : "none",
      registrationDeadline: safeRegistrationDeadlineIso(registrationDeadline),
      registrationNote:
        registrationNote && String(registrationNote).trim()
          ? String(registrationNote).trim()
          : undefined,
    };

    const isProduction = process.env.NODE_ENV === "production";

    if (supabase) {
      // supabase 利用可能な環境では必ずDBに保存する
      const user = await getApiUser();
      if (!user) {
        return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
      }
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json(
          { error: "主催者登録が必要です。主催者ページから主催者登録を行ってから再度お試しください。" },
          { status: 403 }
        );
      }
      const event = await createEvent(supabase, organizerId, formData);
      return NextResponse.json(event, { status: 201 });
    }

    // supabase 未設定: 本番環境ではエラー、開発環境のみフォールバック
    if (isProduction) {
      return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
    }
    const event = addCreatedEvent(formData);
    setOrganizerForCreatedEvent(event.id);
    addDefaultVolunteerRoleForEvent(event);
    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    console.error("[POST /api/events]", e);
    const publicMessage = toPublicEventCreateError(e);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: publicMessage,
        ...(isDev && e instanceof Error ? { debug: e.message } : {}),
      },
      { status: 500 }
    );
  }
}
