"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { PostCreateDraftRow } from "@/components/posts/PostCreateDraftRow";

const VISIBLE_LIMIT = 3;

type Props = {
  drafts: MyPostItem[];
  /** 現在編集中の下書き（一覧から除外する） */
  activeDraftId?: string | null;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
  /** 既存の下書きを更新中なら「下書きを更新」表記にする */
  isUpdate?: boolean;
};

/**
 * 「下書き保存」と「下書き一覧」を1つにまとめた分割ボタン。
 * 本体タップ＝保存、右の件数バッジ＋▾タップ＝一覧ポップオーバー。
 */
export function PostCreateDraftControl({
  drafts,
  activeDraftId,
  onSave,
  saving,
  saved,
  disabled,
  isUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = drafts.filter((p) => p.id !== activeDraftId);
  const hasDrafts = visible.length > 0;

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

  const saveLabel = saving
    ? "保存中…"
    : saved
      ? "保存しました"
      : isUpdate
        ? "下書きを更新"
        : "下書き保存";

  const saveLabelCompact = saving
    ? "保存中…"
    : saved
      ? "保存済"
      : isUpdate
        ? "更新"
        : "下書き";

  return (
    <div className="posts-create-draftctl" ref={wrapRef}>
      <div
        className={cn(
          "posts-create-draftctl__group",
          saved && "posts-create-draftctl__group--saved",
        )}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          aria-label={isUpdate ? "下書きを更新" : "下書き保存"}
          className="posts-create-draftctl__save"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : saved ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          <span className="posts-create-page__action-label posts-create-page__action-label--full">
            {saveLabel}
          </span>
          <span className="posts-create-page__action-label posts-create-page__action-label--compact">
            {saveLabelCompact}
          </span>
        </button>

        <button
          type="button"
          className={cn(
            "posts-create-draftctl__toggle",
            !hasDrafts && "posts-create-draftctl__toggle--placeholder",
          )}
          aria-haspopup={hasDrafts ? "menu" : undefined}
          aria-expanded={hasDrafts ? open : undefined}
          aria-label={hasDrafts ? `下書き一覧 ${visible.length}件` : undefined}
          aria-hidden={!hasDrafts}
          tabIndex={hasDrafts ? 0 : -1}
          disabled={!hasDrafts}
          onClick={() => {
            if (hasDrafts) setOpen((v) => !v);
          }}
        >
          <span className="posts-create-page__drafts-count">
            {hasDrafts ? visible.length : 0}
          </span>
          <ChevronDown
            className={cn(
              "posts-create-draftctl__chevron h-3.5 w-3.5",
              open && "is-open",
            )}
            aria-hidden
          />
        </button>
      </div>

      {open && hasDrafts ? (
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
      ) : null}
    </div>
  );
}
