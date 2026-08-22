"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type FollowUiStatus = "none" | "pending" | "accepted" | "self" | "rejected";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function AuthorAlbumLink({ authorId }: { authorId: string }) {
  if (!UUID_RE.test(authorId)) return null;
  return (
    <Link
      href={`/users/${authorId}/album`}
      className="posts-follow-chat-btn"
      aria-label="アルバムを見る"
      onClick={(e) => e.stopPropagation()}
    >
      <BookOpen className="h-4 w-4" strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function AuthorFollowButton({
  authorId,
  className,
  ghost = false,
}: {
  authorId: string | null | undefined;
  className?: string;
  ghost?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<FollowUiStatus | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    if (!authorId) {
      setStatus("none");
      return;
    }
    let cancelled = false;
    fetch(`/api/follows?userId=${encodeURIComponent(authorId)}`)
      .then(async (res) => {
        if (res.status === 401) return { status: "none" as const };
        if (!res.ok) return { status: "none" as const };
        return (await res.json()) as { status: FollowUiStatus };
      })
      .then((data) => {
        if (!cancelled) setStatus(data.status);
      })
      .catch(() => {
        if (!cancelled) setStatus("none");
      });
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  if (!authorId) return null;

  if (status === "self") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <AuthorAlbumLink authorId={authorId} />
      </span>
    );
  }

  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <AuthorAlbumLink authorId={authorId} />
        <span
          className={cn(
            "posts-follow-btn",
            ghost && "posts-follow-btn--ghost",
            className,
          )}
        >
          …
        </span>
      </span>
    );
  }

  const label =
    status === "accepted"
      ? "フォロー中"
      : status === "pending"
        ? "申請中"
        : "フォローする";

  async function handleClick() {
    if (!authorId || busy) return;
    setBusy(true);
    try {
      if (status === "accepted" || status === "pending") {
        await fetch(`/api/follows?userId=${encodeURIComponent(authorId)}`, {
          method: "DELETE",
        });
        setStatus("none");
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authorId }),
        });
        const json = (await res.json()) as { status?: FollowUiStatus };
        setStatus(json.status === "accepted" ? "accepted" : "pending");
      }
    } finally {
      setBusy(false);
    }
  }

  async function openChat() {
    if (!authorId || chatBusy) return;
    setChatBusy(true);
    try {
      const res = await fetch("/api/me/follow-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authorId }),
      });
      const json = (await res.json()) as {
        conversationId?: string;
        error?: string;
      };
      if (!res.ok || !json.conversationId) {
        window.alert(json.error ?? "チャットの準備に失敗しました");
        return;
      }
      router.push(`/messages/${json.conversationId}`);
    } catch {
      window.alert("チャットの準備に失敗しました");
    } finally {
      setChatBusy(false);
    }
  }

  const showChat = status === "accepted" && UUID_RE.test(authorId);

  return (
    <span className="inline-flex items-center gap-1.5">
      <AuthorAlbumLink authorId={authorId} />
      {showChat ? (
        <button
          type="button"
          disabled={chatBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void openChat();
          }}
          className="posts-follow-chat-btn"
          aria-label="チャットを送る"
        >
          <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className={cn(
          "posts-follow-btn",
          ghost && "posts-follow-btn--ghost",
          (status === "accepted" || status === "pending") &&
            "posts-follow-btn--following",
          className,
        )}
      >
        {label}
      </button>
    </span>
  );
}
