"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDetailImageList } from "@/lib/gallery-images";
import {
  POST_CARD_FALLBACK_IMAGE,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { formatVideoDuration } from "@/lib/posts/post-video";

type Props = {
  post: CommunityPost;
  /** モバイル用に画像を大きく表示 */
  immersive?: boolean;
};

export function PostDetailMedia({ post, immersive = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [index, setIndex] = useState(0);
  const isVideo = Boolean(post.videoUrl);

  const images = useMemo(() => {
    const cover = imgBroken ? POST_CARD_FALLBACK_IMAGE : post.imageUrl;
    return buildDetailImageList(cover, post.galleryImages);
  }, [post.imageUrl, post.galleryImages, imgBroken]);

  const hasMultiple = images.length > 1;
  const safeIndex = Math.min(index, Math.max(0, images.length - 1));
  const activeUrl = images[safeIndex] ?? POST_CARD_FALLBACK_IMAGE;

  const mediaClass = cn(
    "posts-detail-media__img",
    immersive && "posts-detail-media__img--immersive",
  );
  const videoClass = cn(
    "posts-detail-media__video",
    immersive && "posts-detail-media__video--immersive",
  );

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

  if (isVideo && post.videoUrl) {
    return (
      <>
        <video
          ref={videoRef}
          src={post.videoUrl}
          className={videoClass}
          playsInline
          preload="metadata"
          controls={playing}
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing ? (
          <button
            type="button"
            className="posts-detail-media__play"
            aria-label="動画を再生"
            onClick={() => void toggleVideoPlay()}
          >
            <Play className="h-6 w-6 fill-current" aria-hidden />
          </button>
        ) : null}
        {post.durationSec != null ? (
          <span className="posts-detail-media__duration">
            {formatVideoDuration(post.durationSec)}
          </span>
        ) : null}
      </>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeUrl}
        alt={post.title}
        className={mediaClass}
        onError={() => setImgBroken(true)}
      />
      {hasMultiple ? (
        <>
          <button
            type="button"
            className="posts-detail-media__nav posts-detail-media__nav--prev"
            aria-label="前の写真"
            onClick={() =>
              setIndex((i) => (i - 1 + images.length) % images.length)
            }
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="posts-detail-media__nav posts-detail-media__nav--next"
            aria-label="次の写真"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="posts-detail-media__dots" role="tablist">
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`${i + 1}枚目`}
                className={cn(
                  "posts-detail-media__dot",
                  i === safeIndex && "posts-detail-media__dot--active",
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
