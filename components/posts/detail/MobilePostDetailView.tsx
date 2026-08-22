"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import { PostLikeButton } from "@/components/posts/PostLikeButton";
import {
  POST_CATEGORY_COLORS,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { PostDetailMedia } from "@/components/posts/detail/PostDetailMedia";
import { PostDetailComments } from "@/components/posts/detail/PostDetailComments";
import { PostDetailSidebar } from "@/components/posts/detail/PostDetailSidebar";

type Viewer = { name: string } | null;

type Props = {
  post: CommunityPost;
  viewer: Viewer;
};

/** 下部固定アクションバー + ボトムナビ分 */
const MOBILE_ACTION_BAR_PX = 52;
const MOBILE_BOTTOM_NAV_PX = 72;

export function MobilePostDetailView({ post, viewer }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const badgeColor = POST_CATEGORY_COLORS[post.category];
  const albumHref = post.authorId ? `/users/${post.authorId}/album` : null;

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

  return (
    <div
      className="posts-detail-mobile min-[900px]:hidden"
      style={
        {
          "--post-category-color": badgeColor,
          paddingBottom: `calc(${MOBILE_ACTION_BAR_PX + MOBILE_BOTTOM_NAV_PX + 16}px + env(safe-area-inset-bottom, 0px))`,
        } as React.CSSProperties
      }
    >
      <header className="posts-detail-mobile__header">
        <button
          type="button"
          onClick={handleBack}
          className="posts-detail-mobile__header-btn"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="posts-detail-mobile__header-center">
          <Link href="/posts" className="posts-detail-mobile__header-crumb">
            みんなの投稿
          </Link>
          <span className="posts-detail-mobile__header-sep" aria-hidden>
            /
          </span>
          <Link
            href={`/posts?category=${post.category}`}
            className="posts-detail-mobile__header-category"
            style={{ color: badgeColor }}
          >
            {post.categoryLabel}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          className="posts-detail-mobile__header-btn"
          aria-label={saved ? "保存を解除" : "保存"}
        >
          <Bookmark
            className={cn(
              "h-5 w-5",
              saved ? "fill-[#2a5540] text-[#2a5540]" : "text-[#6a6258]",
            )}
            aria-hidden
          />
        </button>
      </header>

      <main className="posts-detail-mobile__main">
        <article className="posts-detail-mobile__article">
          <div className="posts-detail-mobile__hero">
            <div className="posts-detail-media posts-detail-media--immersive posts-detail-media--mobile-card">
              <PostDetailMedia post={post} immersive />
              <span className="posts-detail-media__badge posts-detail-media__badge--pop">
                {post.categoryLabel}
              </span>
            </div>
          </div>

          <div className="posts-detail-body posts-detail-body--mobile posts-detail-body--letter">
            <div className="posts-detail-author posts-detail-author--inline">
              {albumHref ? (
                <Link
                  href={albumHref}
                  className="posts-detail-author__avatar"
                  aria-label={`${post.authorName}のアルバム`}
                >
                  <AuthorAvatar
                    name={post.authorName}
                    src={post.authorAvatarUrl}
                  />
                </Link>
              ) : (
                <span className="posts-detail-author__avatar" aria-hidden>
                  <AuthorAvatar
                    name={post.authorName}
                    src={post.authorAvatarUrl}
                  />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {albumHref ? (
                  <Link href={albumHref} className="posts-detail-author__name">
                    {post.authorName}
                  </Link>
                ) : (
                  <p className="posts-detail-author__name">{post.authorName}</p>
                )}
                <p className="posts-detail-author__time">{post.postedAtLabel}</p>
              </div>
              <AuthorFollowButton authorId={post.authorId} ghost />
            </div>

            <h1 className="posts-detail-title">{post.title}</h1>

            {post.body ? (
              <p className="posts-detail-text">{post.body}</p>
            ) : null}

            {(post.areaLabel || post.tags.length > 0) && (
              <div className="posts-detail-meta-row">
                {post.areaLabel ? (
                  <Link href="/discover" className="posts-detail-area-chip">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{post.areaLabel}</span>
                  </Link>
                ) : null}
                {post.tags.length > 0 ? (
                  <ul className="posts-detail-tags posts-detail-tags--inline">
                    {post.tags.map((tag) => {
                      const label = tag.replace(/^#/, "");
                      return (
                        <li key={tag}>
                          <Link
                            href={`/posts?tag=${encodeURIComponent(label)}`}
                            className="posts-chip posts-chip--tag"
                          >
                            #{label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        </article>

        <PostDetailComments
          postId={post.id}
          initialCount={post.commentCount}
          viewer={viewer}
          sectionId="post-comments"
          variant="mobile"
        />

        <PostDetailSidebar post={post} variant="mobile" />
      </main>

      <footer className="posts-detail-mobile__bar" aria-label="投稿アクション">
        <div className="posts-detail-mobile__bar-pill">
          <PostLikeButton
            postId={post.id}
            initialLiked={Boolean(post.likedByMe)}
            initialCount={post.likeCount}
            className="posts-detail-mobile__bar-btn"
            pressedClassName="posts-detail-mobile__bar-btn--liked"
            iconClassName="h-5 w-5"
          />
          <button
            type="button"
            onClick={scrollToComments}
            className="posts-detail-mobile__bar-btn"
            aria-label="コメントを見る"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            <span>{post.commentCount}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="posts-detail-mobile__bar-btn posts-detail-mobile__bar-btn--share"
          >
            <Share2 className="h-5 w-5" aria-hidden />
            <span>シェア</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
