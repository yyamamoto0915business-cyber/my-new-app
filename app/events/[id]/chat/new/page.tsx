"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

function NewChatRoomContent({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      setEventId(id);
      if (!participantId) {
        setError("participantId が必要です");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/events/${id}/chat/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      if (cancelled) return;
      if (!res.ok) {
        setError("ルームの作成に失敗しました");
        setLoading(false);
        return;
      }
      const room = await res.json();
      router.replace(`/events/${id}/chat/${room.id}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, participantId, router]);

  if (loading && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">チャットを準備しています...</p>
      </div>
    );
  }

  if (error && eventId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`/events/${eventId}/chat`} className="mt-4 block text-sm text-zinc-600">
          ← チャット一覧へ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-zinc-500">読み込み中...</p>
    </div>
  );
}

export default function NewChatRoomPage(props: Props) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    }>
      <NewChatRoomContent {...props} />
    </Suspense>
  );
}
