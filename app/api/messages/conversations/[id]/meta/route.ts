import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { hasDirectPostgresEnv } from "@/lib/direct-postgres-config";
import { fetchConversationMetaDirectDb } from "@/lib/conversation-direct-db";
import { resolveAvatarUrlByRole } from "@/lib/profile-avatar";

const LOG_TAG = "[api/messages/conversations/.../meta]";

/**
 * GET: conversation のイベント名 / 主催者名などメタ情報
 * - RLS: conversations の member policy により、会話メンバー以外は 401/403 相当で弾かれる
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase が設定されていません" },
      { status: 503 }
    );
  }

  const { id: conversationId } = await params;
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId が必要です" },
      { status: 400 }
    );
  }

  if (hasDirectPostgresEnv()) {
    try {
      const meta = await fetchConversationMetaDirectDb(user.id, conversationId);
      if (!meta) {
        return NextResponse.json({ error: "会話が見つかりません" }, { status: 404 });
      }
      if (meta.eventId != null && meta.eventTitle == null) {
        return NextResponse.json(
          { error: "イベントが見つかりません" },
          { status: 404 }
        );
      }
      const myRole = meta.organizerProfileId === user.id ? "organizer" : "volunteer";
      let counterpartDisplayName: string | null =
        myRole === "organizer" ? "ボランティア参加者" : meta.organizerDisplayName ?? "主催者";
      let counterpartAvatarUrl: string | null =
        myRole === "organizer"
          ? null
          : resolveAvatarUrlByRole(
              {
                avatar_url: meta.organizerAvatarUrl,
                participant_avatar_url: meta.organizerParticipantAvatarUrl,
                organizer_avatar_url: meta.organizerOrganizerAvatarUrl,
              },
              "organizer"
            );
      if (myRole === "organizer" && meta.otherUserId) {
        const { data: participant } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, participant_avatar_url")
          .eq("id", meta.otherUserId)
          .maybeSingle();
        counterpartDisplayName = participant?.display_name ?? counterpartDisplayName;
        counterpartAvatarUrl =
          participant?.participant_avatar_url ?? participant?.avatar_url ?? null;
      }
      return NextResponse.json({
        eventId: meta.eventId,
        eventTitle: meta.eventTitle ?? "イベント",
        conversationKind: meta.conversationKind ?? "event_inquiry",
        myRole,
        counterpartDisplayName,
        counterpartAvatarUrl,
      });
    } catch (e) {
      console.error(LOG_TAG, "direct db meta failed, falling back to supabase", e);
    }
  }

  try {
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("kind, event_id, organizer_id, other_user_id, organizers(profile_id)")
      .eq("id", conversationId)
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "会話が見つかりません" },
        { status: 404 }
      );
    }

    const organizerProfileId = (
      Array.isArray(conv.organizers) ? conv.organizers[0] : conv.organizers
    )?.profile_id as string | undefined;
    const myRole = organizerProfileId === user.id ? "organizer" : "volunteer";
    const counterpartUserId =
      myRole === "organizer" ? (conv.other_user_id as string | null) : organizerProfileId ?? null;

    const [{ data: event }, { data: counterpart }] = await Promise.all([
      conv.event_id
        ? supabase.from("events").select("title").eq("id", conv.event_id).maybeSingle()
        : Promise.resolve({ data: null as { title: string } | null }),
      counterpartUserId
        ? supabase
            .from("profiles")
            .select("display_name, avatar_url, participant_avatar_url, organizer_avatar_url")
            .eq("id", counterpartUserId)
            .maybeSingle()
        : Promise.resolve({
            data: null as {
              display_name: string | null;
              avatar_url: string | null;
              participant_avatar_url: string | null;
              organizer_avatar_url: string | null;
            } | null,
          }),
    ]);

    return NextResponse.json({
      eventId: (conv.event_id as string | null) ?? null,
      eventTitle: event?.title ?? "イベント",
      conversationKind: (conv.kind as string | null) ?? "event_inquiry",
      myRole,
      counterpartDisplayName:
        counterpart?.display_name ?? (myRole === "organizer" ? "ボランティア参加者" : "主催者"),
      counterpartAvatarUrl:
        myRole === "organizer"
          ? counterpart?.participant_avatar_url ?? counterpart?.avatar_url ?? null
          : resolveAvatarUrlByRole(
              {
                avatar_url: counterpart?.avatar_url ?? null,
                participant_avatar_url: counterpart?.participant_avatar_url ?? null,
                organizer_avatar_url: counterpart?.organizer_avatar_url ?? null,
              },
              "organizer"
            ),
    });
  } catch {
    return NextResponse.json(
      { error: "メタ情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

