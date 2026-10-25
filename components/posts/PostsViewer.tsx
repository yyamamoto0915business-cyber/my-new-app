"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Heart, MapPin, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_CARD_FALLBACK_IMAGE,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import { usePostLike } from "@/components/posts/PostLikeButton";
import { PostCommentsSheet } from "@/components/posts/PostCommentsSheet";
import { shortAreaLabel } from "@/lib/posts/area-label";
import styles from "./PostsExplore.module.css";

const DOUBLE_TAP_MS = 280;
/** 写真枠の縦横比の範囲（インスタと同じ：縦長 4:5 〜 横長 1.91:1） */
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;

function clampRatio(w: number, h: number): number | null {
  if (!w || !h) return null;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h));
}

type CommentsTarget = { postId: string; onAdded: () => void };

function ViewerSlide({
  post,
  active,
  onToast,
  onOpenComments,
}: {
  post: CommunityPost;
  active: boolean;
  onToast: (message: string) => void;
  onOpenComments: (target: CommentsTarget) => void;
}) {
  const { liked, count, busy, setLike, toggle } = usePostLike(
    post.id,
    Boolean(post.likedByMe),
    post.likeCount,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  /** 1 枚目（または動画）の縦横比に枠を合わせる。読み込み前は正方形 */
  const [ratio, setRatio] = useState(1);
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const isVideo = Boolean(post.videoUrl);
  const photos =
    !isVideo && post.galleryImages && post.galleryImages.length > 1
      ? post.galleryImages
      : [post.imageUrl || POST_CARD_FALLBACK_IMAGE];

  // 画面に入った動画だけ再生する
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.currentTime = 0;
      void el.play().catch(() => setPaused(true));
      setPaused(false);
    } else {
      el.pause();
    }
  }, [active]);

  useEffect(
    () => () => {
      if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current);
    },
    [],
  );

  function handleMediaTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      if (singleTapTimer.current) window.clearTimeout(singleTapTimer.current);
      setBurst((n) => n + 1);
      void setLike(true);
      return;
    }
    lastTapRef.current = now;
    if (!isVideo) return;
    singleTapTimer.current = window.setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      if (el.paused) {
        void el.play();
        setPaused(false);
      } else {
        el.pause();
        setPaused(true);
      }
    }, DOUBLE_TAP_MS);
  }

  async function share() {
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      onToast("リンクをコピーしました");
    } catch {
      // 共有シートを閉じただけのときは何もしない
    }
  }

  const authorHref = post.authorId ? `/users/${post.authorId}/album` : null;
  const author = (
    <>
      <span className={styles.viewerAvatar}>
        <AuthorAvatar name={post.authorName} src={post.authorAvatarUrl} />
      </span>
      <span className={styles.viewerAuthorName}>{post.authorName}</span>
    </>
  );

  return (
    <article className={styles.slide} aria-label={post.title}>
      <div className={styles.slideInner}>
        <div className={styles.slideHead}>
          {authorHref ? (
            <Link href={authorHref} className={styles.viewerAuthor}>
              {author}
            </Link>
          ) : (
            <span className={styles.viewerAuthor}>{author}</span>
          )}
          {post.areaLabel ? (
            <span className={styles.slidePlace}>
              <MapPin className="h-3 w-3" aria-hidden />
              {shortAreaLabel(post.areaLabel)}
            </span>
          ) : null}
        </div>

        <div
          className={styles.slideMedia}
          style={{ aspectRatio: String(ratio) }}
          onClick={handleMediaTap}
        >
          {isVideo && post.videoUrl ? (
            <video
              ref={videoRef}
              src={post.videoUrl}
              poster={
                post.imageUrl && post.imageUrl !== post.videoUrl ? post.imageUrl : undefined
              }
              playsInline
              muted
              loop
              preload={active ? "auto" : "metadata"}
              onLoadedMetadata={(e) => {
                const r = clampRatio(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
                if (r) setRatio(r);
              }}
            />
          ) : (
            <div
              className={styles.slideGallery}
              onScroll={(e) => {
                const el = e.currentTarget;
                setPhotoIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
              }}
            >
              {photos.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={i === 0 ? post.title : ""}
                  loading="lazy"
                  draggable={false}
                  onLoad={(e) => {
                    if (i !== 0) return;
                    const r = clampRatio(
                      e.currentTarget.naturalWidth,
                      e.currentTarget.naturalHeight,
                    );
                    if (r) setRatio(r);
                  }}
                  onError={(e) => {
                    if (e.currentTarget.src !== POST_CARD_FALLBACK_IMAGE) {
                      e.currentTarget.src = POST_CARD_FALLBACK_IMAGE;
                    }
                  }}
                />
              ))}
            </div>
          )}
          {isVideo && paused ? (
            <span className={styles.slidePaused} aria-hidden>
              ▶
            </span>
          ) : null}
          {burst > 0 ? (
            <Heart
              key={burst}
              className={styles.heartBurst}
              fill="currentColor"
              aria-hidden
            />
          ) : null}
          {photos.length > 1 ? (
            <span className={styles.photoCount}>
              {photoIndex + 1}/{photos.length}
            </span>
          ) : null}
        </div>

        <div className={styles.slideBar}>
          <div className={styles.slideActions}>
            <button
              type="button"
              className={styles.action}
              onClick={() => void toggle()}
              disabled={busy}
              aria-label="いいね"
              aria-pressed={liked}
            >
              <Heart
                className={cn(styles.actionIcon, liked && styles.actionIconLiked)}
                fill={liked ? "currentColor" : "none"}
                aria-hidden
              />
              <span>{count}</span>
            </button>
            <button
              type="button"
              className={styles.action}
              aria-label="コメントを見る"
              onClick={() =>
                onOpenComments({
                  postId: post.id,
                  onAdded: () => setCommentCount((n) => n + 1),
                })
              }
            >
              <MessageCircle className={styles.actionIcon} aria-hidden />
              <span>{commentCount}</span>
            </button>
            <button
              type="button"
              className={styles.action}
              onClick={() => void share()}
              aria-label="共有"
            >
              <Send className={styles.actionIcon} aria-hidden />
            </button>
          </div>
          {photos.length > 1 ? (
            <div className={styles.dots} aria-hidden>
              {photos.map((_, i) => (
                <span key={i} className={cn(styles.dot, i === photoIndex && styles.dotActive)} />
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.slideInfo}>
          <h2 className={styles.slideTitle}>{post.title}</h2>
          {post.body ? (
            <button
              type="button"
              className={cn(styles.slideBody, expanded && styles.slideBodyExpanded)}
              onClick={() => setExpanded((v) => !v)}
            >
              {post.body}
            </button>
          ) : null}
          <p className={styles.slideDate}>
            {post.categoryLabel} · {post.postedAtLabel}
          </p>
        </div>
      </div>
    </article>
  );
}

type Props = {
  posts: CommunityPost[];
  startIndex: number;
  onClose: () => void;
};

/** 投稿を全画面で、上下スワイプで次々に見るビューア */
export function PostsViewer({ posts, startIndex, onClose }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [toast, setToast] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentsTarget | null>(null);
  const commentsOpenRef = useRef(false);
  useEffect(() => {
    commentsOpenRef.current = comments !== null;
  }, [comments]);

  // 端末の「戻る」で閉じられるよう履歴を 1 つ積む
  useEffect(() => {
    if (!window.history.state?.postsViewer) {
      window.history.pushState({ ...window.history.state, postsViewer: true }, "");
    }
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  const close = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // コメント欄が開いていれば、まずそれだけ閉じる
      if (commentsOpenRef.current) setComments(null);
      else close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = startIndex * el.clientHeight;
  }, [startIndex]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ヘッダーや下部ナビより前面に出すため body 直下に描画する
  return createPortal(
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label="投稿を見る">
      <header className={styles.viewerHeader}>
        <button
          type="button"
          className={styles.viewerBack}
          onClick={close}
          aria-label="一覧に戻る"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </button>
        <span className={styles.viewerTitle}>みんなの投稿</span>
      </header>
      <div
        ref={scrollerRef}
        className={styles.viewerScroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
          if (i !== activeIndex) setActiveIndex(i);
        }}
      >
        {posts.map((post, i) => (
          <ViewerSlide
            key={post.id}
            post={post}
            active={i === activeIndex}
            onToast={setToast}
            onOpenComments={setComments}
          />
        ))}
      </div>
      {comments ? (
        <PostCommentsSheet
          key={comments.postId}
          postId={comments.postId}
          onAdded={comments.onAdded}
          onClose={() => setComments(null)}
        />
      ) : null}
      {toast ? (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
