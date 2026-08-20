"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PostCreatePreviewCard } from "@/components/posts/PostCreatePreviewCard";
import type { PostCreateDraft } from "@/lib/posts/post-create-draft";

type Props = {
  draft: PostCreateDraft;
  open: boolean;
  onClose: () => void;
};

export function PostCreatePreviewSheet({ draft, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="posts-create-preview-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="投稿プレビュー"
    >
      <button
        type="button"
        className="posts-create-preview-sheet__overlay"
        aria-label="プレビューを閉じる"
        onClick={onClose}
      />
      <div className="posts-create-preview-sheet__panel">
        <div className="posts-create-preview-sheet__grip" aria-hidden />
        <div className="posts-create-preview-sheet__head">
          <h2 className="posts-create-preview-sheet__title">投稿プレビュー</h2>
          <button
            type="button"
            className="posts-create-preview-sheet__close"
            aria-label="閉じる"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="posts-create-preview-sheet__body">
          <PostCreatePreviewCard draft={draft} />
        </div>
      </div>
    </div>
  );
}
