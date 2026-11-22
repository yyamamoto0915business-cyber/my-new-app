"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** フォローする相手（主催者のアカウントのプロフィール）。ないときはフォローできない */
  targetUserId?: string | null;
  /** 見ている人（ログインしていなければ null） */
  viewerId?: string | null;
  className?: string;
  fullWidth?: boolean;
  mobileStyle?: boolean;
  pcStyle?: boolean;
};

export function OrganizerFollowButton({
  targetUserId = null,
  viewerId = null,
  className = "",
  fullWidth = false,
  mobileStyle = false,
  pcStyle = false,
}: Props) {
  // 前は押しても見た目だけ変わり、保存されなかった。ユーザー同士のフォロー（/api/follows）で保存する
  const router = useRouter();
  const [followed, setFollowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const isSelf = Boolean(viewerId && targetUserId && viewerId === targetUserId);

  useEffect(() => {
    if (!viewerId || !targetUserId || isSelf) return;
    let cancelled = false;
    fetch(`/api/follows?userId=${encodeURIComponent(targetUserId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { status?: string } | null) => {
        if (!cancelled && json) setFollowed(json.status === "accepted" || json.status === "pending");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [viewerId, targetUserId, isSelf]);

  async function toggle() {
    if (!targetUserId || busy) return;
    if (!viewerId) {
      router.push(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const next = !followed;
    setFollowed(next);
    try {
      const res = next
        ? await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetUserId }),
          })
        : await fetch(`/api/follows?userId=${encodeURIComponent(targetUserId)}`, { method: "DELETE" });
      if (!res.ok) setFollowed(!next);
    } catch {
      setFollowed(!next);
    } finally {
      setBusy(false);
    }
  }

  if (!targetUserId || isSelf) return null;
  const roundedClass = mobileStyle || pcStyle ? "rounded-xl" : "rounded-full";

  return (
    <button
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={followed}
      className={`flex items-center justify-center gap-2 font-semibold transition-all ${roundedClass} ${
        pcStyle ? "min-w-0 flex-1" : fullWidth ? "w-full" : "flex-1"
      } ${mobileStyle || pcStyle ? "h-11 text-[14px]" : ""} ${className}`}
      style={
        followed
          ? {
              background: "#fff",
              color: "#173f2c",
              border: "1.5px solid #c9d8cd",
              padding: mobileStyle || pcStyle ? "0" : "12px 0",
              fontSize: mobileStyle ? 13 : 14,
            }
          : {
              background: "linear-gradient(to bottom, #245a3e, #173f2c)",
              color: "#f6ebc8",
              border: "1.5px solid #d9bc6e",
              padding: mobileStyle || pcStyle ? "0" : "12px 0",
              fontSize: mobileStyle ? 13 : 14,
            }
      }
    >
      {followed ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          フォロー中
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          フォローする
        </>
      )}
    </button>
  );
}
