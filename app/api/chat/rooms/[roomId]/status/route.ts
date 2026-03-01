import { createClient } from "@/lib/supabase/server";
import { getChatRoomById, sendSystemMessage } from "@/lib/db/chat";
import {
  isOrganizerOfEvent,
  getOrganizerProfileId,
  getParticipantStatus,
  updateParticipantStatus,
  type ParticipantStatus,
} from "@/lib/db/events";
import { createNotification } from "@/lib/db/notifications";
import { NextResponse } from "next/server";

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  applied: "申込済み",
  confirmed: "参加確定",
  declined: "辞退",
  change_requested: "変更希望",
  checked_in: "集合確認済み",
  completed: "参加完了",
};

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { roomId } = await params;

  if (!supabase) {
    return NextResponse.json({ status: null }, { status: 200 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const room = await getChatRoomById(supabase, roomId);
  if (!room || !room.event_id || !room.participant_id) {
    return NextResponse.json({ status: null }, { status: 200 });
  }

  const status = await getParticipantStatus(
    supabase,
    room.event_id,
    room.participant_id
  );
  return NextResponse.json({ status });
}

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  const { roomId } = await params;

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase が設定されていません" },
      { status: 503 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status as ParticipantStatus | undefined;
  const validStatuses: ParticipantStatus[] = [
    "confirmed",
    "declined",
    "change_requested",
    "checked_in",
  ];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "有効なステータスを指定してください" },
      { status: 400 }
    );
  }

  const room = await getChatRoomById(supabase, roomId);
  if (!room || !room.event_id || !room.participant_id) {
    return NextResponse.json(
      { error: "ルームが見つかりません" },
      { status: 404 }
    );
  }

  const eventId = room.event_id;
  const participantId = room.participant_id;
  const isOrganizer = await isOrganizerOfEvent(supabase, eventId, user.id);

  // 参加者は confirmed, declined, change_requested のみ
  // 主催者は checked_in のみ（参加者のステータスを更新）
  if (isOrganizer) {
    if (status !== "checked_in") {
      return NextResponse.json(
        { error: "主催者は「集合確認済み」のみ設定できます" },
        { status: 403 }
      );
    }
  } else {
    if (user.id !== participantId) {
      return NextResponse.json(
        { error: "このルームの参加者ではありません" },
        { status: 403 }
      );
    }
    if (status === "checked_in") {
      return NextResponse.json(
        { error: "参加者は「集合確認済み」を設定できません" },
        { status: 403 }
      );
    }
  }

  const targetUserId = participantId;
  const ok = await updateParticipantStatus(
    supabase,
    eventId,
    targetUserId,
    status
  );
  if (!ok) {
    return NextResponse.json(
      { error: "ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }

  const label = STATUS_LABELS[status];
  const systemContent = isOrganizer
    ? `主催者が参加者を「${label}」に更新しました`
    : `参加者が「${label}」に更新しました`;

  const msg = await sendSystemMessage(
    supabase,
    roomId,
    systemContent,
    user.id
  );

  const notifyUserId = isOrganizer ? participantId : await getOrganizerProfileId(supabase, eventId);
  if (notifyUserId) {
    await createNotification(
      supabase,
      notifyUserId,
      status === "confirmed" ? "participation_confirmed" : "status_updated",
      label,
      {
        body: systemContent,
        link: `/events/${eventId}/chat/${roomId}`,
      }
    );
  }

  return NextResponse.json({
    status,
    label,
    message: msg,
  });
}
