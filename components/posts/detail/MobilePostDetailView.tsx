"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import { usePostLike } from "@/components/posts/PostLikeButton";
import {
  POST_CARD_FALLBACK_IMAGE,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { buildDetailImageList } from "@/lib/gallery-images";
import { shortAreaLabel } from "@/lib/posts/area-label";
import { PostDetailComments } from "@/components/posts/detail/PostDetailComments";
import { PostDetailSidebar } from "@/components/posts/detail/PostDetailSidebar";
import { ModerationMenu } from "@/components/moderation/ModerationMenu";

type Viewer = { name: string; id?: string } | null;

type Props = {
  post: CommunityPost;
  viewer: Viewer;
};

/** 写真枠の縦横比の範囲（インスタと同じ：縦長 4:5 〜 横長 1.91:1） */
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;
/** 本文がこれより長いときは「続きを読む」で開く */
const BODY_PREVIEW_CHARS = 90;

function clampRatio(w: number, h: number): number | null {
  if (!w || !h) return null;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, w / h));
}

/** 左右スワイプで見る写真（または動画） */
function PostMedia({ post }: { post: CommunityPost }) {
  const [index, setIndex] = useState(0);
  const [ratio, setRatio] = useState(1);
  const [playing, setPlaying] = useState(false);
  const photos = useMemo(
    () => buildDetailImageList(post.imageUrl, post.galleryImages),
    [post.imageUrl, post.galleryImages],
  );

  if (post.videoUrl) {
    return (
      <div className="relative w-full bg-black" style={{ aspectRatio: String(ratio) }}>
        <video
          src={post.videoUrl}
          poster={post.imageUrl && post.imageUrl !== post.videoUrl ? post.imageUrl : undefined}
          className="h-full w-full object-cover"
          playsInline
          loop
          controls={playing}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const r = clampRatio(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
            if (r) setRatio(r);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={(e) => {
            const el = e.currentTarget;
            if (el.paused) void el.play();
            else el.pause();
          }}
        />
        {!playing ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white">
              <Play className="h-6 w-6 fill-current" aria-hidden />
            </span>
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#f2f0ec]" style={{ aspectRatio: String(ratio) }}>
      <div
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        {photos.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`${src}-${i}`}
            src={src}
            alt={i === 0 ? post.title : ""}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className="h-full w-full flex-shrink-0 snap-center object-cover"
            onLoad={(e) => {
              if (i !== 0) return;
              const r = clampRatio(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
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
      {photos.length > 1 ? (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-[600] text-white">
            {index + 1}/{photos.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 -bottom-6 flex justify-center gap-1" aria-hidden>
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === index ? "bg-[#2a5540]" : "bg-[#d4cfc6]",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** スマホの投稿詳細（インスタのように、写真が主役のシンプルな形） */
export function MobilePostDetailView({ post, viewer }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const { liked, count, busy, toggle } = usePostLike(
    post.id,
    Boolean(post.likedByMe),
    post.likeCount,
  );
  const albumHref = post.authorId ? `/users/${post.authorId}/album` : null;
  const longBody = post.body.length > BODY_PREVIEW_CHARS;

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/posts");
  }, [router]);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: post.title, url: window.location.href });
        return;
      } catch {
        /* キャンセル時は何もしない */
      }
    }
    try {
      await navigator.clipboard?.writeText(window.location.href);
    } catch {
      /* noop */
    }
  }

  function scrollToComments() {
    document
      .getElementById("post-comments")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const avatar = (
    <span className="block h-9 w-9 overflow-hidden rounded-full">
      <AuthorAvatar name={post.authorName} src={post.authorAvatarUrl} />
    </span>
  );

  return (
    <div className="min-h-screen bg-white pb-6 text-[#1f1a14] min-[900px]:hidden">
      {/* 上の帯 */}
      <header className="sticky top-0 z-40 flex h-[calc(48px+env(safe-area-inset-top,0px))] items-center border-b border-[#efebe4] bg-white/95 px-1 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-11 w-11 items-center justify-center"
          aria-label="戻る"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </button>
        <span className="flex-1 text-center text-[16px] font-[700]">投稿</span>
        <span className="h-11 w-11" aria-hidden />
      </header>

      <article>
        {/* 投稿者 */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {albumHref ? (
            <Link href={albumHref} aria-label={`${post.authorName}のアルバム`}>
              {avatar}
            </Link>
          ) : (
            avatar
          )}
          <div className="min-w-0 flex-1 leading-tight">
            {albumHref ? (
              <Link href={albumHref} className="block truncate text-[14px] font-[700]">
                {post.authorName}
              </Link>
            ) : (
              <p className="truncate text-[14px] font-[700]">{post.authorName}</p>
            )}
            {post.areaLabel ? (
              <Link
                href="/discover"
                className="mt-0.5 flex items-center gap-0.5 truncate text-[12px] text-[#6b6358]"
              >
                <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
                <span className="truncate">{shortAreaLabel(post.areaLabel)}</span>
              </Link>
            ) : null}
          </div>
          <AuthorFollowButton authorId={post.authorId} compact ghost />
          <ModerationMenu
            targetType="post"
            targetId={post.id}
            authorId={post.authorId}
            authorName={post.authorName}
            viewerId={viewer?.id}
            className="text-[#1f1a14] opacity-100"
            iconClassName="h-5 w-5"
            ownerActions={{
              editHref: `/posts/${post.id}/edit`,
              onDeleted: () => router.replace("/posts"),
            }}
            onReported={() => router.replace("/posts")}
            onBlockChange={(blocked) => {
              if (blocked) router.replace("/posts");
            }}
          />
        </div>

        <PostMedia post={post} />

        {/* いいね・コメント・シェア・保存 */}
        <div className="flex items-center gap-1 px-1.5 pt-1.5">
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            aria-label="いいね"
            aria-pressed={liked}
            className="flex h-11 items-center gap-1.5 px-2 text-[14px] font-[600]"
          >
            <Heart
              className={cn("h-[26px] w-[26px]", liked && "text-[#e04444]")}
              fill={liked ? "currentColor" : "none"}
              aria-hidden
            />
            {count}
          </button>
          <button
            type="button"
            onClick={scrollToComments}
            aria-label="コメントを見る"
            className="flex h-11 items-center gap-1.5 px-2 text-[14px] font-[600]"
          >
            <MessageCircle className="h-[25px] w-[25px]" aria-hidden />
            {post.commentCount}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label="シェア"
            className="flex h-11 items-center px-2"
          >
            <Send className="h-[24px] w-[24px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? "保存を解除" : "保存"}
            aria-pressed={saved}
            className="ml-auto flex h-11 items-center px-2"
          >
            <Bookmark
              className="h-[25px] w-[25px]"
              fill={saved ? "currentColor" : "none"}
              aria-hidden
            />
          </button>
        </div>

        {/* タイトル・本文 */}
        <div className="px-3.5 pb-1">
          <h1 className="text-[15px] font-[700] leading-snug">{post.title}</h1>
          {post.body ? (
            <p className="mt-1 whitespace-pre-line text-[14px] leading-[1.7] text-[#3a332a]">
              {longBody && !bodyOpen ? (
                <>
                  {post.body.slice(0, BODY_PREVIEW_CHARS)}…
                  <button
                    type="button"
                    onClick={() => setBodyOpen(true)}
                    className="ml-1 text-[#8a8176]"
                  >
                    続きを読む
                  </button>
                </>
              ) : (
                post.body
              )}
            </p>
          ) : null}
          {post.tags.length > 0 ? (
            <p className="mt-1.5 flex flex-wrap gap-x-2 text-[14px]">
              {post.tags.map((tag) => {
                const label = tag.replace(/^#/, "");
                return (
                  <Link
                    key={tag}
                    href={`/posts?tag=${encodeURIComponent(label)}`}
                    className="text-[#2a5c8a]"
                  >
                    #{label}
                  </Link>
                );
              })}
            </p>
          ) : null}
          <p className="mt-1.5 text-[12px] text-[#9a9186]">
            {post.postedAtLabel}
            {post.visitedDetailLabel ? ` · ${post.visitedDetailLabel}` : ""}
          </p>
        </div>
      </article>

      <div className="mt-3 border-t border-[#efebe4] px-3 pt-1">
        <PostDetailComments
          postId={post.id}
          initialCount={post.commentCount}
          viewer={viewer}
          sectionId="post-comments"
          variant="mobile"
        />
      </div>

      <div className="px-3">
        <PostDetailSidebar post={post} variant="mobile" />
      </div>
    </div>
  );
}
