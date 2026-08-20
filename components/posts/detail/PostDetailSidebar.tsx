"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CommunityPost } from "@/lib/posts/mock-feed";

type Props = {
  post: CommunityPost;
  variant?: "desktop" | "mobile";
};

const POST_PLACE_MAP_HREF = "/events?view=map";

export function PostDetailSidebar({ post, variant = "desktop" }: Props) {
  const areaLabel = post.areaLabel?.trim() || "このまち";
  const [following, setFollowing] = useState(false);
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <aside className="posts-detail-sidebar posts-detail-sidebar--mobile">
        <Link href={POST_PLACE_MAP_HREF} className="posts-mobile-place-link">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>マップで見る</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="posts-detail-sidebar">
      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">この場所について</h2>
        <div className="posts-place-map" aria-hidden>
          <span className="posts-place-map__pin">
            <MapPin className="h-4 w-4" />
          </span>
        </div>
        <p className="posts-place__name">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {areaLabel}
        </p>
        <Link href={POST_PLACE_MAP_HREF} className="posts-place__link">
          マップで見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">投稿者</h2>
        <div className="posts-author-card">
          <span className="posts-author-card__avatar" aria-hidden>
            {post.authorName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="posts-author-card__name">{post.authorName}</p>
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
      </section>

      <section className="posts-side-cta">
        <div className="posts-side-cta__body">
          <p className="posts-side-cta__eyebrow">
            <Sprout className="h-3.5 w-3.5" aria-hidden />
            まちの瞬間を、記録しよう
          </p>
          <p className="posts-side-cta__desc">
            見つけた景色や特別をシェアして、まちの魅力を一緒に広げませんか。
          </p>
          <Link href="/posts/new" className="posts-side-cta__link">
            みんなの投稿をはじめる
          </Link>
        </div>
      </section>
    </aside>
  );
}
