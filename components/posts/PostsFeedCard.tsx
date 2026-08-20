"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_CARD_FALLBACK_IMAGE,
  POST_CATEGORY_COLORS,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { formatVideoDuration } from "@/lib/posts/post-video";

const PIN_COLORS = ["#e85d5d", "#4a90d9", "#e8b84a", "#5B9E5A", "#c47ab0"];

type Props = {
  post: CommunityPost;
  index?: number;
};

export function PostsFeedCard({ post, index = 0 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState(post.imageUrl);
  const badgeColor = POST_CATEGORY_COLORS[post.category];
  const pinColor = PIN_COLORS[index % PIN_COLORS.length];
  const tilt = index % 3 === 0 ? "-0.6deg" : index % 3 === 1 ? "0.5deg" : "0deg";
  const isVideo = Boolean(post.videoUrl);
  const gallery = post.galleryImages ?? [];
  const hasGallery = !isVideo && gallery.length > 1;
  const activePhoto = hasGallery ? gallery[photoIndex] ?? gallery[0] : imgSrc;

  async function toggleVideoPlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <article
      className="posts-card"
      style={{
        ["--posts-pin" as string]: pinColor,
        ["--card-tilt" as string]: tilt,
        transform: `rotate(${tilt})`,
      }}
    >
      <span className="posts-card__pin" aria-hidden />

      <Link
        href={`/posts/${post.id}`}
        className="posts-card__stretch"
        aria-label={`${post.title} の詳細を見る`}
      />

      <div className="posts-card__media">
        {isVideo && post.videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={post.videoUrl}
              className="posts-card__video"
              playsInline
              preload="metadata"
              loop
              muted
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <button
              type="button"
              className={cn(
                "posts-card__play",
                playing && "posts-card__play--hidden",
              )}
              aria-label={playing ? "動画を一時停止" : "動画を再生"}
              onClick={() => void toggleVideoPlay()}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
            </button>
            {post.durationSec != null ? (
              <span className="posts-card__duration">
                {formatVideoDuration(post.durationSec)}
              </span>
            ) : null}
          </>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={activePhoto}
            alt=""
            loading="lazy"
            onError={() => {
              if (activePhoto !== POST_CARD_FALLBACK_IMAGE) {
                setImgSrc(POST_CARD_FALLBACK_IMAGE);
              }
            }}
          />
        )}
        {hasGallery ? (
          <>
            <span className="posts-card__gallery-count">
              {photoIndex + 1}/{gallery.length}
            </span>
            <button
              type="button"
              className="posts-card__gallery-nav posts-card__gallery-nav--prev"
              aria-label="前の写真"
              onClick={() =>
                setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)
              }
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="posts-card__gallery-nav posts-card__gallery-nav--next"
              aria-label="次の写真"
              onClick={() => setPhotoIndex((i) => (i + 1) % gallery.length)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
        <span
          className="posts-card__badge"
          style={{ backgroundColor: badgeColor }}
        >
          {post.categoryLabel}
        </span>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          className="posts-card__bookmark"
          aria-label={saved ? "保存を解除" : "保存"}
        >
          <Bookmark
            className={cn(
              "h-3.5 w-3.5",
              saved ? "fill-[#2a5540] text-[#2a5540]" : "text-[#6a6258]",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div className="posts-card__body">
        <div className="posts-card__author">
          <span className="posts-card__avatar">
            {post.authorName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#2a2218]">
              {post.authorName}
            </p>
            <p className="text-[10px] text-[#9a9088]">{post.postedAtLabel}</p>
          </div>
        </div>

        <h3 className="posts-card__title">{post.title}</h3>
        {post.body ? (
          <p className="posts-card__excerpt">{post.body}</p>
        ) : null}

        <div className="posts-card__meta">
          <MapPin className="h-3 w-3 shrink-0 text-[#8a6a48]" aria-hidden />
          <span className="truncate">{post.areaLabel || "—"}</span>
          {post.relatedHref && post.relatedLabel ? (
            <Link href={post.relatedHref} className="posts-card__related">
              {post.relatedLabel}
            </Link>
          ) : null}
        </div>

        <div className="posts-card__footer">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className="posts-card__like inline-flex items-center gap-1"
            aria-label="いいね"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                liked ? "fill-[#E04444] text-[#E04444]" : "",
              )}
              aria-hidden
            />
            {post.likeCount + (liked ? 1 : 0)}
          </button>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {post.commentCount}
          </span>
        </div>
      </div>
    </article>
  );
}
