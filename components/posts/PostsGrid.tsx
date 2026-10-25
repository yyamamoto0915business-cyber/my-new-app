"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_CARD_FALLBACK_IMAGE,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { shortAreaLabel } from "@/lib/posts/area-label";
import styles from "./PostsExplore.module.css";

/** 9 枚ごとに 1 枚を 2×2 の「注目」マスにする（左右交互） */
function featuredSide(index: number): "left" | "right" | null {
  if (index % 18 === 0) return "left";
  if (index % 18 === 9) return "right";
  return null;
}

function GridTile({
  post,
  index,
  onOpen,
}: {
  post: CommunityPost;
  index: number;
  onOpen: (index: number) => void;
}) {
  const [src, setSrc] = useState(post.imageUrl || POST_CARD_FALLBACK_IMAGE);
  const side = featuredSide(index);
  const isVideo = Boolean(post.videoUrl);
  const hasGallery = !isVideo && (post.galleryImages?.length ?? 0) > 1;
  // ポスターのない動画は imageUrl に動画 URL が入っている
  const noPoster = isVideo && (!post.imageUrl || post.imageUrl === post.videoUrl);

  return (
    <button
      type="button"
      className={cn(
        styles.tile,
        side === "left" && styles.tileFeaturedLeft,
        side === "right" && styles.tileFeaturedRight,
      )}
      onClick={() => onOpen(index)}
      aria-label={`${post.title}（${post.areaLabel || "場所なし"}）を開く`}
    >
      {noPoster && post.videoUrl ? (
        <video src={`${post.videoUrl}#t=0.1`} muted playsInline preload="metadata" />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          loading={index < 9 ? "eager" : "lazy"}
          onError={() => {
            if (src !== POST_CARD_FALLBACK_IMAGE) setSrc(POST_CARD_FALLBACK_IMAGE);
          }}
        />
      )}
      {isVideo ? (
        <Play className={cn(styles.tileIcon, "fill-current")} aria-hidden />
      ) : hasGallery ? (
        <Copy className={styles.tileIcon} aria-hidden />
      ) : null}
      {side ? (
        <span className={styles.tileCaption}>
          <span className={styles.tileCaptionPlace}>
            {post.areaLabel ? `📍${shortAreaLabel(post.areaLabel)}` : post.categoryLabel}
          </span>
          {post.likeCount > 0 ? (
            <span className={styles.tileCaptionLikes}>
              <Heart className="h-3 w-3" fill="currentColor" aria-hidden />
              {post.likeCount}
            </span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

type Props = {
  posts: CommunityPost[];
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  onOpen: (index: number) => void;
  /** 表示中の件数（スクロールで増やす） */
  visibleCount: number;
  onLoadMore: () => void;
};

export function PostsGrid({
  posts,
  loading,
  loadError,
  onRetry,
  onOpen,
  visibleCount,
  onLoadMore,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visible.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="投稿を読み込んでいます">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={cn(
              styles.tile,
              styles.tileSkeleton,
              i === 0 && styles.tileFeaturedLeft,
            )}
          />
        ))}
      </div>
    );
  }

  if (loadError && posts.length === 0) {
    return (
      <div className="posts-empty space-y-3">
        <p>投稿を読み込めませんでした</p>
        {onRetry ? (
          <button type="button" className="posts-load-more__btn" onClick={onRetry}>
            再読み込み
          </button>
        ) : null}
      </div>
    );
  }

  if (posts.length === 0) {
    return <p className="posts-empty">条件に合う投稿はまだありません</p>;
  }

  return (
    <>
      <div className={styles.grid}>
        {visible.map((post, i) => (
          <GridTile key={post.id} post={post} index={i} onOpen={onOpen} />
        ))}
      </div>
      {hasMore ? <div ref={sentinelRef} className={styles.sentinel} aria-hidden /> : null}
    </>
  );
}
