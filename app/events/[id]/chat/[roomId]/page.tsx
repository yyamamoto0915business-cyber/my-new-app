"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createClient } from "@/lib/supabase/client";
import { ChatRoom } from "@/components/chat/chat-room";
import { MOCK_USER_ID } from "@/lib/chat-mock";

type Props = {
  params: Promise<{ id: string; roomId: string }>;
};

export default function EventChatRoomPage({ params }: Props) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<{
    participant_id?: string | null;
    event?: { title: string };
    participant?: { display_name: string | null };
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id, roomId: rid } = await params;
      setEventId(id);
      setRoomId(rid);
      const supabase = createClient();
      if (!supabase) {
        setCurrentUserId(MOCK_USER_ID);
        try {
          const roomRes = await fetchWithTimeout(`/api/chat/rooms/${rid}`);
          if (cancelled) return;
          if (!roomRes.ok) {
            setError(roomRes.status === 404 ? "ルームが見つかりません" : "読み込みに失敗しました");
            setLoading(false);
            return;
          }
          const roomData = await roomRes.json();
          if (cancelled) return;
          setRoom(roomData);
        } catch {
          setError("通信に失敗しました");
        }
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?returnTo=${encodeURIComponent(`/events/${id}/chat/${rid}`)}`);
        return;
      }
      setCurrentUserId(user.id);
      try {
        const roomRes = await fetchWithTimeout(`/api/chat/rooms/${rid}`);
        if (cancelled) return;
        if (!roomRes.ok) {
          setError(roomRes.status === 404 ? "ルームが見つかりません" : "通信に失敗しました");
          setLoading(false);
          return;
        }
        const roomData = await roomRes.json();
        if (cancelled) return;
        setRoom(roomData);
      } catch {
        setError("通信に失敗しました");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  if (loading || !eventId || !roomId || !currentUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 mr-4 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
        <Link href={`/events/${eventId}`} className="text-sm text-zinc-600 underline">
          ← イベント詳細へ
        </Link>
      </div>
    );
  }

  const isParticipant = room?.participant_id === currentUserId;
  const otherPartyName = isParticipant
    ? "主催者"
    : (room?.participant?.display_name ?? "参加者");

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href={`/events/${eventId}/chat`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            ← 質問一覧へ
          </Link>
          <h1 className="mt-2 text-xl font-semibold">
            {room?.event?.title ?? "Q&A"} - {otherPartyName}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <ChatRoom
          roomId={roomId}
          currentUserId={currentUserId}
          otherPartyName={otherPartyName}
        />
      </main>
    </div>
  );
}
