"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  postId: string;
  initialLiked?: boolean;
  initialCount: number;
  className?: string;
  pressedClassName?: string;
  iconClassName?: string;
  stopCardNav?: boolean;
};

export function PostLikeButton({
  postId,
  initialLiked = false,
  initialCount,
  className,
  pressedClassName,
  iconClassName = "h-3.5 w-3.5",
  stopCardNav = false,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    if (stopCardNav) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (busy) return;
    const next = !liked;
    setLiked(next);
    setCount((n) => Math.max(0, n + (next ? 1 : -1)));
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
        method: next ? "POST" : "DELETE",
      });
      if (res.status === 401) {
        setLiked(false);
        setCount(initialCount);
        router.push(`/auth?next=/posts/${postId}`);
        return;
      }
      if (!res.ok) {
        setLiked(!next);
        setCount((n) => Math.max(0, n + (next ? -1 : 1)));
        return;
      }
      const json = (await res.json()) as { liked?: boolean; likeCount?: number };
      if (typeof json.liked === "boolean") setLiked(json.liked);
      if (typeof json.likeCount === "number") setCount(json.likeCount);
    } catch {
      setLiked(!next);
      setCount((n) => Math.max(0, n + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void toggle(e)}
      className={cn(className, liked && pressedClassName)}
      aria-label="いいね"
      aria-pressed={liked}
      disabled={busy}
    >
      <Heart
        className={cn(
          iconClassName,
          liked ? "fill-[#E04444] text-[#E04444]" : "",
        )}
        aria-hidden
      />
      <span>{count}</span>
    </button>
  );
}
