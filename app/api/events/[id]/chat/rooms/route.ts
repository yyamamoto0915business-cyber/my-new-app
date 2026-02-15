import { createClient } from "@/lib/supabase/server";
import {
  getEventChatRoomsForOrganizer,
  getEventChatRoomForParticipant,
  getOrCreateEventChatRoom,
} from "@/lib/db/chat";
import {
  fetchEventById,
  fetchEventParticipants,
  isOrganizerOfEvent,
} from "@/lib/db/events";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "チャットは Supabase 連携時にご利用ください" },
      { status: 503 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const event = await fetchEventById(supabase, eventId);
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const isOrganizer = await isOrganizerOfEvent(supabase, eventId, user.id);

  if (isOrganizer) {
    const [rooms, participants] = await Promise.all([
      getEventChatRoomsForOrganizer(supabase, eventId),
      fetchEventParticipants(supabase, eventId),
    ]);
    return NextResponse.json({
      rooms,
      participants,
      role: "organizer",
    });
  }

  const room = await getEventChatRoomForParticipant(supabase, eventId, user.id);
  if (!room) {
    return NextResponse.json({ rooms: [], role: "participant" });
  }
  return NextResponse.json({ rooms: [room], role: "participant" });
}

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "チャットは Supabase 連携時にご利用ください" },
      { status: 503 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const body = await request.json().catch(() => ({}));
  const participantId = body.participantId as string | undefined;

  if (!participantId) {
    return NextResponse.json(
      { error: "participantId が必要です" },
      { status: 400 }
    );
  }

  const room = await getOrCreateEventChatRoom(
    supabase,
    eventId,
    participantId,
    user.id
  );
  if (!room) {
    return NextResponse.json(
      { error: "ルームの作成に失敗しました" },
      { status: 500 }
    );
  }
  return NextResponse.json(room);
}
