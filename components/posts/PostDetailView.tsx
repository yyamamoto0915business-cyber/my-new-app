"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_CATEGORY_COLORS,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import { PostDetailMedia } from "@/components/posts/detail/PostDetailMedia";
import { PostDetailComments } from "@/components/posts/detail/PostDetailComments";
import { PostDetailSidebar } from "@/components/posts/detail/PostDetailSidebar";
import { MobilePostDetailView } from "@/components/posts/detail/MobilePostDetailView";

type Viewer = { name: string } | null;

type Props = {
  post: CommunityPost;
  viewer: Viewer;
};

function PostDetailBreadcrumb({
  post,
  categoryColor,
}: {
  post: CommunityPost;
  categoryColor: string;
}) {
  return (
    <nav className="posts-detail-crumb" aria-label="パンくず">
      <div className="posts-detail-crumb__inner">
        <Link href="/posts" className="posts-detail-crumb__link">
          みんなの投稿
        </Link>
        <span className="posts-detail-crumb__sep" aria-hidden>
          ›
        </span>
        <Link
          href={`/posts?category=${post.category}`}
          className="posts-detail-crumb__link posts-detail-crumb__link--category"
          style={{ color: categoryColor }}
        >
          {post.categoryLabel}
        </Link>
        <span className="posts-detail-crumb__sep" aria-hidden>
          ›
        </span>
        <span className="posts-detail-crumb__current">{post.title}</span>
      </div>
    </nav>
  );
}

function DesktopPostDetailView({ post, viewer }: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const badgeColor = POST_CATEGORY_COLORS[post.category];

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

  return (
    <div
      className="posts-detail-page hidden min-[900px]:block"
      style={
        {
          "--post-category-color": badgeColor,
        } as React.CSSProperties
      }
    >
      <PostDetailBreadcrumb post={post} categoryColor={badgeColor} />

      <div className="posts-detail-shell posts-detail-shell--wide">
        <div className="posts-detail-grid">
          <main className="posts-detail-main">
            <article className="posts-detail-card posts-detail-card--pop">
              <div className="posts-detail-media posts-detail-media--pop">
                <PostDetailMedia post={post} />
                <span className="posts-detail-media__badge posts-detail-media__badge--pop">
                  {post.categoryLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setSaved((v) => !v)}
                  className="posts-detail-media__bookmark"
                  aria-label={saved ? "保存を解除" : "保存"}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      saved
                        ? "fill-[#2a5540] text-[#2a5540]"
                        : "text-[#6a6258]",
                    )}
                    aria-hidden
                  />
                </button>
              </div>

              <div className="posts-detail-body posts-detail-body--letter posts-detail-body--desktop">
                <div className="posts-detail-author posts-detail-author--inline">
                  <span className="posts-detail-author__avatar" aria-hidden>
                    {post.authorName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="posts-detail-author__name">
                      {post.authorName}
                    </p>
                    <p className="posts-detail-author__time">
                      {post.postedAtLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFollowing((v) => !v)}
                    className={cn(
                      "posts-follow-btn",
                      following && "posts-follow-btn--following",
                    )}
                  >
                    {following ? "フォロー中" : "フォローする"}
                  </button>
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

                {post.relatedHref && post.relatedLabel ? (
                  <Link href={post.relatedHref} className="posts-detail-related">
                    {post.relatedLabel}
                  </Link>
                ) : null}

                <div className="posts-detail-actions posts-detail-actions--pill">
                  <button
                    type="button"
                    onClick={() => setLiked((v) => !v)}
                    className={cn(
                      "posts-detail-action",
                      liked && "posts-detail-action--liked",
                    )}
                    aria-label="いいね"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        liked ? "fill-[#E04444] text-[#E04444]" : "",
                      )}
                      aria-hidden
                    />
                    {post.likeCount + (liked ? 1 : 0)}
                  </button>
                  <span className="posts-detail-action">
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {post.commentCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="posts-detail-action"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    シェア
                  </button>
                </div>
              </div>
            </article>

            <PostDetailComments
              postId={post.id}
              initialCount={post.commentCount}
              viewer={viewer}
            />
          </main>

          <PostDetailSidebar post={post} />
        </div>
      </div>
    </div>
  );
}

export function PostDetailView({ post, viewer }: Props) {
  return (
    <>
      <MobilePostDetailView post={post} viewer={viewer} />
      <DesktopPostDetailView post={post} viewer={viewer} />
    </>
  );
}
