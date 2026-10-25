"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/** いいねの状態と切り替え（楽観更新・未ログイン時はログインへ） */
export function usePostLike(
  postId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const setLike = useCallback(
    async (next: boolean) => {
      if (busy || next === liked) return;
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
    },
    [busy, liked, postId, initialCount, router],
  );

  return { liked, count, busy, setLike, toggle: () => setLike(!liked) };
}

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
  const { liked, count, busy, toggle } = usePostLike(
    postId,
    initialLiked,
    initialCount,
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopCardNav) {
          e.preventDefault();
          e.stopPropagation();
        }
        void toggle();
      }}
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
