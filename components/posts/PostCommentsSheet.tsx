"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import type { PostCommentView } from "@/lib/db/community-post-comments-types";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import styles from "./PostsExplore.module.css";

/** 下に引いてこれ以上動いたら閉じる */
const DRAG_CLOSE_PX = 90;

type Props = {
  postId: string;
  onClose: () => void;
  /** コメントを書き込めたとき（件数の表示を増やす用） */
  onAdded: () => void;
};

/** 全画面ビューアの上に、下からせり上がるコメント欄（インスタ風） */
export function PostCommentsSheet({ postId, onClose, onAdded }: Props) {
  const [comments, setComments] = useState<PostCommentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { comments?: PostCommentView[] }) => {
        if (active) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (active) setComments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        setError("コメントを送れませんでした");
        return;
      }
      const created = (await res.json()) as PostCommentView;
      setComments((prev) => [created, ...prev]);
      setDraft("");
      onAdded();
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("コメントを送れませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  // つまみ部分を下に引いて閉じる
  const dragHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      dragStart.current = e.touches[0].clientY;
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (dragStart.current == null) return;
      setDragY(Math.max(0, e.touches[0].clientY - dragStart.current));
    },
    onTouchEnd: () => {
      if (dragY > DRAG_CLOSE_PX) onClose();
      setDragY(0);
      dragStart.current = null;
    },
  };

  return (
    <div className={styles.sheetLayer}>
      <button
        type="button"
        className={styles.sheetBackdrop}
        aria-label="コメントを閉じる"
        onClick={onClose}
      />
      <section
        className={styles.sheet}
        role="dialog"
        aria-label="コメント"
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
      >
        <div className={styles.sheetHead} {...dragHandlers}>
          <span className={styles.sheetGrip} aria-hidden />
          <h2 className={styles.sheetTitle}>コメント</h2>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="閉じる"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <ul ref={listRef} className={styles.sheetList}>
          {loading ? (
            <li className={styles.sheetEmpty}>読み込んでいます…</li>
          ) : comments.length === 0 ? (
            <li className={styles.sheetEmpty}>
              <strong>まだコメントはありません</strong>
              <span>最初のひとことを届けてみませんか。</span>
            </li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className={styles.comment}>
                <span className={styles.commentAvatar}>
                  <AuthorAvatar name={c.authorName} src={c.authorAvatarUrl} />
                </span>
                <div className={styles.commentMain}>
                  <p className={styles.commentMeta}>
                    <span className={styles.commentName}>{c.authorName}</span>
                    <span>{c.postedAtLabel}</span>
                  </p>
                  <p className={styles.commentBody}>{c.body}</p>
                </div>
              </li>
            ))
          )}
        </ul>

        {needsLogin ? (
          <div className={styles.sheetLogin}>
            <span>コメントするにはログインしてください</span>
            <Link href={`/auth?next=/posts/${postId}`} className={styles.sheetLoginLink}>
              ログイン
            </Link>
          </div>
        ) : (
          <form className={styles.sheetForm} onSubmit={submit}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="コメントを書く…"
              aria-label="コメントを書く"
              maxLength={500}
              enterKeyHint="send"
            />
            <button
              type="submit"
              className={styles.sheetSend}
              disabled={!draft.trim() || submitting}
              aria-label="送信"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </form>
        )}
        {error ? <p className={styles.sheetError}>{error}</p> : null}
      </section>
    </div>
  );
}
