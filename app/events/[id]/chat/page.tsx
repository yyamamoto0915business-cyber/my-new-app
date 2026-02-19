"use client";

import { useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatRoomList } from "@/components/chat/chat-room-list";
import { MOCK_USER_ID } from "@/lib/chat-mock";

function ParticipantStartChat({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setCreating(true);
    setError(null);
    try {
      const supabase = createClient();
      const participantId = supabase ? (await supabase.auth.getUser()).data.user?.id : MOCK_USER_ID;
      if (supabase && !participantId) {
        setCreating(false);
        router.replace(`/login?returnTo=${encodeURIComponent(`/events/${eventId}/chat`)}`);
        return;
      }
      const res = await fetch(`/api/events/${eventId}/chat/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: participantId ?? MOCK_USER_ID }),
      });
      if (!res.ok) {
        setError("チャットの開始に失敗しました");
        setCreating(false);
        return;
      }
      const room = await res.json();
      if (!room?.id) {
        setError("チャットの開始に失敗しました");
        setCreating(false);
        return;
      }
      router.replace(`/events/${eventId}/chat/${room.id}`);
    } catch {
      setError("チャットの開始に失敗しました");
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        主催者への質問を投稿しますか？
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleStart}
        disabled={creating}
        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {creating ? "準備中..." : "質問を始める"}
      </button>
      <Link href={`/events/${eventId}`} className="mt-4 ml-4 text-sm text-zinc-600">
        ← イベント詳細へ
      </Link>
    </div>
  );
}

type Props = {
  params: Promise<{ id: string }>;
};

export default function EventChatPage({ params }: Props) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [participants, setParticipants] = useState<{ user_id: string; display_name: string | null; email: string | null }[]>([]);
  const [role, setRole] = useState<"organizer" | "participant" | null>(null);
  const [participantRoom, setParticipantRoom] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      setEventId(id);
      let res: Response;
      try {
        res = await fetchWithTimeout(`/api/events/${id}/chat/rooms`);
      } catch {
        setError("通信に失敗しました");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      if (res.status === 401) {
        router.replace(`/login?returnTo=${encodeURIComponent(`/events/${id}/chat`)}`);
        return;
      }
      if (!res.ok) {
        setError(res.status === 404 ? "イベントが見つかりません" : "読み込みに失敗しました");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setRooms(data.rooms ?? []);
      setParticipants(data.participants ?? []);
      setRole(data.role ?? "participant");
      if (data.role === "participant" && data.rooms?.length === 1) {
        setParticipantRoom(data.rooms[0]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  if (loading || !eventId) {
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
          onClick={() => {
            setError(null);
            setLoading(true);
            if (eventId) {
              fetchWithTimeout(`/api/events/${eventId}/chat/rooms`)
                .then((r) => {
                  if (r.status === 401) {
                    router.replace(`/login?returnTo=${encodeURIComponent(`/events/${eventId}/chat`)}`);
                    return null;
                  }
                  return r.ok ? r.json() : null;
                })
                .then((data) => {
                  if (data) {
                    setRooms(data.rooms ?? []);
                    setParticipants(data.participants ?? []);
                    setRole(data.role ?? "participant");
                    if (data.role === "participant" && data.rooms?.length === 1) {
                      setParticipantRoom(data.rooms[0]);
                    }
                  } else if (eventId) {
                    setError("読み込みに失敗しました");
                  }
                })
                .catch(() => setError("通信に失敗しました"))
                .finally(() => setLoading(false));
            }
          }}
          className="mt-4 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
        <Link
          href={`/events/${eventId}`}
          className="mt-4 ml-4 block text-sm text-zinc-600 hover:underline"
        >
          ← イベント詳細へ
        </Link>
      </div>
    );
  }

  if (role === "participant" && participantRoom) {
    router.replace(`/events/${eventId}/chat/${participantRoom.id}`);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">質問画面へ移動中...</p>
      </div>
    );
  }

  if (role === "participant" && !participantRoom) {
    return (
      <ParticipantStartChat eventId={eventId} />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href={`/events/${eventId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            ← イベント詳細へ
          </Link>
          <h1 className="mt-2 text-xl font-semibold">主催者への質問（Q&A）</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <ChatRoomList
          eventId={eventId}
          rooms={rooms as { id: string; participant_id: string | null; participant?: { display_name: string | null; email: string | null } | null }[]}
          participants={participants}
        />
      </main>
    </div>
  );
}
