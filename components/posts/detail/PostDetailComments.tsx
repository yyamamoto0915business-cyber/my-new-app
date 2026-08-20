"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostCommentView } from "@/lib/db/community-post-comments-types";

type Viewer = { name: string } | null;

type Props = {
  postId: string;
  initialCount: number;
  viewer: Viewer;
  sectionId?: string;
  variant?: "desktop" | "mobile";
};

type SortKey = "new" | "old";

export function PostDetailComments({
  postId,
  initialCount,
  viewer,
  sectionId,
  variant = "desktop",
}: Props) {
  const [comments, setComments] = useState<PostCommentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("new");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isMobile = variant === "mobile";
  const collapsedCount = isMobile ? 1 : 3;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { comments: PostCommentView[] }) => {
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

  const sorted = useMemo(() => {
    const list = [...comments];
    list.sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "new" ? diff : -diff;
    });
    return list;
  }, [comments, sort]);

  const count = Math.max(initialCount, comments.length);
  const visible = expanded ? sorted : sorted.slice(0, collapsedCount);
  const hiddenCount = sorted.length - visible.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setError("コメントするにはログインが必要です");
        return;
      }
      if (!res.ok) {
        setError("コメントの投稿に失敗しました");
        return;
      }
      const created = (await res.json()) as PostCommentView;
      setComments((prev) => [created, ...prev]);
      setDraft("");
    } catch {
      setError("コメントの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const sortControls = (
    <div className="posts-comments__sort" role="group" aria-label="並び替え">
      <button
        type="button"
        className={cn(
          "posts-comments__sort-btn",
          sort === "new" && "posts-comments__sort-btn--active",
        )}
        onClick={() => setSort("new")}
      >
        新しい順
      </button>
      <button
        type="button"
        className={cn(
          "posts-comments__sort-btn",
          sort === "old" && "posts-comments__sort-btn--active",
        )}
        onClick={() => setSort("old")}
      >
        古い順
      </button>
    </div>
  );

  const commentContent = (
    <>
      {loading ? (
        <p className="posts-comments__empty">コメントを読み込んでいます…</p>
      ) : sorted.length === 0 ? (
        <p className="posts-comments__empty">
          まだコメントはありません。最初のひとことを届けてみませんか。
        </p>
      ) : (
        <ul className="posts-comments__list">
          {visible.map((c) => (
            <li key={c.id} className="posts-comment">
              <span className="posts-comment__avatar" aria-hidden>
                {c.authorName.slice(0, 1).toUpperCase()}
              </span>
              <div className="posts-comment__main">
                <div className="posts-comment__meta">
                  <span className="posts-comment__name">{c.authorName}</span>
                  <span className="posts-comment__time">{c.postedAtLabel}</span>
                </div>
                <p className="posts-comment__body">{c.body}</p>
              </div>
              <button
                type="button"
                className="posts-comment__like"
                aria-label="コメントにいいね"
                onClick={() =>
                  setLiked((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                }
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    liked[c.id] ? "fill-[#E04444] text-[#E04444]" : "",
                  )}
                  aria-hidden
                />
                {c.likeCount + (liked[c.id] ? 1 : 0)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && sorted.length > collapsedCount ? (
        <button
          type="button"
          className={cn(
            "posts-comments__toggle",
            isMobile && "posts-comments__toggle--link",
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "コメントを折りたたむ"
            : `すべてのコメントを見る（残り${hiddenCount}件）`}
        </button>
      ) : null}

      {viewer ? (
        <form
          className={cn(
            "posts-comment-form",
            isMobile && "posts-comment-form--sticky",
          )}
          onSubmit={handleSubmit}
        >
          <span className="posts-comment__avatar" aria-hidden>
            {viewer.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="posts-comment-form__field">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="コメントを入力…"
              rows={1}
              maxLength={500}
              className="posts-comment-form__input"
            />
            <button
              type="submit"
              className="posts-comment-form__submit"
              disabled={!draft.trim() || submitting}
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              投稿する
            </button>
          </div>
          {error ? <p className="posts-comment-form__error">{error}</p> : null}
        </form>
      ) : (
        <div className="posts-comment-login">
          <p className="posts-comment-login__text">
            コメントするにはログインしてください。
          </p>
          <Link
            href={`/auth?next=/posts/${postId}`}
            className="posts-comment-login__btn"
          >
            ログイン / 新規登録
          </Link>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="posts-comments-block" id={sectionId}>
        <div className="posts-comments-block__divider">
          <span className="posts-comments-block__line" aria-hidden />
          <h2 className="posts-comments-block__label">みんなの声</h2>
          <span className="posts-comments-block__line" aria-hidden />
        </div>
        <div className="posts-comments-block__toolbar">
          <p className="posts-comments-block__count">コメント {count}件</p>
          {sortControls}
        </div>
        <section
          className="posts-comments posts-comments--pop posts-comments--mobile"
          aria-label="コメント"
        >
          {commentContent}
        </section>
      </div>
    );
  }

  return (
    <div
      className="posts-comments-block posts-comments-block--desktop"
      id={sectionId}
    >
      <div className="posts-comments-block__divider">
        <span className="posts-comments-block__line" aria-hidden />
        <h2 className="posts-comments-block__label">みんなの声</h2>
        <span className="posts-comments-block__line" aria-hidden />
      </div>
      <div className="posts-comments-block__toolbar">
        <p className="posts-comments-block__count">コメント {count}件</p>
        {sortControls}
      </div>
      <section
        className="posts-comments posts-comments--pop"
        aria-label="コメント"
      >
        {commentContent}
      </section>
    </div>
  );
}
