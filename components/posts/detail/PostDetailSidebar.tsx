"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, MapPin, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_CARD_FALLBACK_IMAGE,
  POST_CATEGORY_COLORS,
  type CommunityPost,
} from "@/lib/posts/mock-feed";
import {
  getAuthorFollowerCount,
  getNearbyPosts,
  getPostPlaceInfo,
} from "@/lib/posts/mock-detail";

function NearbyThumb({ src, color }: { src: string; color: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <div className="posts-nearby__thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt=""
        loading="lazy"
        onError={() => {
          if (imgSrc !== POST_CARD_FALLBACK_IMAGE) {
            setImgSrc(POST_CARD_FALLBACK_IMAGE);
          }
        }}
      />
      <span
        className="posts-nearby__badge"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

type Props = {
  post: CommunityPost;
  variant?: "desktop" | "mobile";
};

const POST_PLACE_MAP_HREF = "/events?view=map";

export function PostDetailSidebar({ post, variant = "desktop" }: Props) {
  const place = getPostPlaceInfo(post);
  const nearby = getNearbyPosts(post);
  const followers = getAuthorFollowerCount(post);
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

        {nearby.length > 0 ? (
          <section className="posts-nearby-block" aria-label="この近くのしるし">
            <div className="posts-nearby-block__head">
              <h2 className="posts-nearby-block__title">この近くのしるし</h2>
              <Link href="/posts" className="posts-nearby-block__more">
                もっと見る →
              </Link>
            </div>
            <ul className="posts-nearby__scroll">
              {nearby.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/posts/${p.id}`}
                    className="posts-nearby__scroll-card"
                  >
                    <NearbyThumb
                      src={p.imageUrl}
                      color={POST_CATEGORY_COLORS[p.category]}
                    />
                    <p className="posts-nearby__scroll-title">{p.title}</p>
                    <p className="posts-nearby__scroll-meta">{p.authorName}</p>
                    <p className="posts-nearby__scroll-likes">
                      <Heart className="h-3 w-3" aria-hidden />
                      {p.likeCount}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
          {place.areaLabel}
        </p>
        <p className="posts-place__desc">{place.description}</p>
        <Link href={POST_PLACE_MAP_HREF} className="posts-place__link">
          マップで見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {nearby.length > 0 ? (
        <section className="posts-side-panel">
          <div className="posts-side-panel__head">
            <h2 className="posts-side-panel__title">この近くのしるし</h2>
            <Link href="/posts" className="posts-side-panel__more">
              もっと見る →
            </Link>
          </div>
          <ul className="posts-nearby__list">
            {nearby.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="posts-nearby__item">
                  <NearbyThumb
                    src={p.imageUrl}
                    color={POST_CATEGORY_COLORS[p.category]}
                  />
                  <div className="min-w-0">
                    <p className="posts-nearby__title">{p.title}</p>
                    <p className="posts-nearby__meta">
                      {p.authorName} · {p.likeCount} いいね
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">投稿者</h2>
        <div className="posts-author-card">
          <span className="posts-author-card__avatar" aria-hidden>
            {post.authorName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="posts-author-card__name">{post.authorName}</p>
            <p className="posts-author-card__followers">
              フォロワー {followers}人
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
