"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportDialog, type ReportTargetType } from "@/components/moderation/ReportDialog";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  /** 書いた人。ブロックの対象 */
  authorId: string | null | undefined;
  authorName?: string;
  /** 自分の投稿・コメントならメニューを出さない */
  viewerId?: string | null;
  /** ブロック中かどうか（ユーザーのページなど、わかっているとき） */
  initialBlocked?: boolean;
  onReported?: () => void;
  onBlockChange?: (blocked: boolean) => void;
  className?: string;
  iconClassName?: string;
  /** メニューを開く向き */
  align?: "left" | "right";
  direction?: "down" | "up";
};

/** 「…」から通報・ブロックをするメニュー */
export function ModerationMenu({
  targetType,
  targetId,
  authorId,
  authorName,
  viewerId,
  initialBlocked = false,
  onReported,
  onBlockChange,
  className,
  iconClassName = "h-4 w-4",
  align = "right",
  direction = "down",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // 「受け付けました」を見せてから一覧から消すため、閉じたときに知らせる
  const reportedRef = useRef(false);

  useEffect(() => setBlocked(initialBlocked), [initialBlocked]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (viewerId && authorId && viewerId === authorId) return null;

  const canBlock = Boolean(authorId && UUID_RE.test(authorId));
  const who = authorName ? `${authorName}さん` : "この人";

  async function toggleBlock() {
    if (!authorId || busy) return;
    const next = !blocked;
    if (
      next &&
      !window.confirm(
        `${who}をブロックしますか？\nお互いの投稿・コメントが表示されなくなり、フォローも解除されます。`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${authorId}/block`, {
        method: next ? "POST" : "DELETE",
      });
      if (res.status === 401) {
        router.push(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "うまくいきませんでした");
      }
      setBlocked(next);
      setOpen(false);
      onBlockChange?.(next);
    } catch (err) {
      alert(err instanceof Error ? err.message : "うまくいきませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-flex" data-no-swipe>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5 text-current opacity-70 transition hover:opacity-100",
          className,
        )}
        aria-label="その他の操作（通報・ブロック）"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className={iconClassName} aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 min-w-[190px] overflow-hidden rounded-xl border border-[#e6ddd0] bg-white py-1 text-sm text-[#2a2218] shadow-lg",
            align === "right" ? "right-0" : "left-0",
            direction === "down" ? "top-full mt-1" : "bottom-full mb-1",
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-[#f6f1e8]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setReporting(true);
            }}
          >
            <Flag className="h-4 w-4 text-[#b3261e]" aria-hidden />
            通報する
          </button>
          {canBlock ? (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-[#f6f1e8] disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                void toggleBlock();
              }}
            >
              <Ban className="h-4 w-4 text-[#6a6258]" aria-hidden />
              {blocked ? `${who}のブロックを解除` : `${who}をブロック`}
            </button>
          ) : null}
        </div>
      ) : null}

      {reporting ? (
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          onClose={() => {
            setReporting(false);
            if (reportedRef.current) {
              reportedRef.current = false;
              onReported?.();
            }
          }}
          onReported={() => {
            reportedRef.current = true;
          }}
        />
      ) : null}
    </div>
  );
}
