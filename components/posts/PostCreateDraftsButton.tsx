"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileEdit } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { PostCreateDraftRow } from "@/components/posts/PostCreateDraftRow";

const VISIBLE_LIMIT = 3;

type Props = {
  drafts: MyPostItem[];
  /** 現在編集中の下書き（一覧から除外する） */
  activeDraftId?: string | null;
};

/** ヘッダーの「下書き中」ボタン。押すと下書きをポップオーバーで表示する */
export function PostCreateDraftsButton({ drafts, activeDraftId }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = drafts.filter((p) => p.id !== activeDraftId);

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

  // 下書きが無ければボタン自体を出さない
  if (visible.length === 0) return null;

  return (
    <div className="posts-create-page__drafts-wrap" ref={wrapRef}>
      <button
        type="button"
        className="posts-create-page__drafts"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`下書き中 ${visible.length}件`}
        onClick={() => setOpen((v) => !v)}
      >
        <FileEdit className="h-4 w-4" aria-hidden />
        <span className="posts-create-page__action-label">下書き中</span>
        <span className="posts-create-page__drafts-count">{visible.length}</span>
      </button>

      {open && (
        <div className="posts-create-page__drafts-pop" role="menu">
          <p className="posts-create-page__drafts-pop-title">下書き中</p>
          <ul className="posts-create-drafts__list">
            {visible.slice(0, VISIBLE_LIMIT).map((post) => (
              <PostCreateDraftRow
                key={post.id}
                post={post}
                onSelect={() => setOpen(false)}
              />
            ))}
          </ul>
          <Link
            href="/profile/posts?view=drafts"
            className="posts-create-drafts__all"
            onClick={() => setOpen(false)}
          >
            下書きをすべて見る
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
