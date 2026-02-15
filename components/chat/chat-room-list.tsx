"use client";

import Link from "next/link";

type Participant = {
  user_id: string;
  display_name: string | null;
  email: string | null;
};

type Room = {
  id: string;
  participant_id: string | null;
  participant?: { display_name: string | null; email: string | null } | null;
};

type ChatRoomListProps = {
  eventId: string;
  rooms: Room[];
  participants: Participant[];
};

function displayName(p: { display_name: string | null; email: string | null } | null): string {
  if (!p) return "参加者";
  return p.display_name?.trim() || p.email || "参加者";
}

export function ChatRoomList({
  eventId,
  rooms,
  participants,
}: ChatRoomListProps) {
  const roomByParticipant = new Map(
    rooms.map((r) => [r.participant_id ?? "", r])
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        チャットする参加者を選んでください
      </p>
      {participants.length === 0 ? (
        <p className="text-sm text-zinc-500">参加者はまだいません</p>
      ) : (
        <ul className="space-y-2">
          {participants.map((p) => {
            const room = roomByParticipant.get(p.user_id);
            const name = p.display_name?.trim() || p.email || "参加者";
            return (
              <li key={p.user_id}>
                <Link
                  href={
                    room
                      ? `/events/${eventId}/chat/${room.id}`
                      : `/events/${eventId}/chat/new?participantId=${p.user_id}`
                  }
                  className="block rounded-lg border border-zinc-200/60 bg-white px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <span className="font-medium">{name}</span>
                  {room && (
                    <span className="ml-2 text-xs text-zinc-500">
                      チャットへ →
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
