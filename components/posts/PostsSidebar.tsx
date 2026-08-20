"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Crown, Plus } from "lucide-react";
import {
  collectPostAreas,
  POST_CARD_FALLBACK_IMAGE,
  type CommunityPost,
} from "@/lib/posts/mock-feed";

const CROWN_COLORS = ["#d4a017", "#a8b0b8", "#c47a3a"] as const;
const CTA_SHARE_ILLUST = "/posts/cta-share-illust.png";

function SidebarPostThumb({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[6px] bg-[#efe6d8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          if (imgSrc !== POST_CARD_FALLBACK_IMAGE) {
            setImgSrc(POST_CARD_FALLBACK_IMAGE);
          }
        }}
      />
    </div>
  );
}

function collectPopularTags(posts: CommunityPost[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const key = tag.startsWith("#") ? tag : `#${tag}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([tag]) => tag);
}

type Props = {
  posts: CommunityPost[];
};

export function PostsSidebar({ posts }: Props) {
  const popular = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 3),
    [posts],
  );
  const areas = useMemo(() => collectPostAreas(posts).slice(0, 6), [posts]);
  const tags = useMemo(() => collectPopularTags(posts), [posts]);

  return (
    <aside className="posts-sidebar">
      {popular.length > 0 ? (
        <section className="posts-side-panel">
          <h2 className="posts-side-panel__title">人気の投稿</h2>
          <ol className="mt-3 space-y-3">
            {popular.map((post, index) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex gap-2.5 rounded-md transition hover:bg-[#f7f1e6]/80"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    aria-label={`${index + 1}位`}
                  >
                    <Crown
                      className="h-4 w-4"
                      style={{ color: CROWN_COLORS[index] ?? "#8a6a28" }}
                      fill="currentColor"
                      aria-hidden
                    />
                  </span>
                  <SidebarPostThumb src={post.imageUrl} alt="" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[#2a2218]">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#9a9088]">
                      {post.likeCount} いいね · {post.areaLabel}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {areas.length > 0 ? (
        <section className="posts-side-panel">
          <h2 className="posts-side-panel__title">注目エリア</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {areas.map((area) => (
              <span key={area} className="posts-chip">
                {area}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {tags.length > 0 ? (
        <section className="posts-side-panel">
          <h2 className="posts-side-panel__title">人気タグ</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="posts-chip posts-chip--tag">
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="posts-side-cta">
        <div className="posts-side-cta__body">
          <h2 className="posts-side-cta__title">あなたのまちの魅力を投稿しよう</h2>
          <p className="posts-side-cta__desc">
            写真ひと枚、短い言葉でも大丈夫。感じたことを共有してみませんか。
          </p>
          <Link href="/posts/new" className="posts-hero-cta posts-hero-cta--sm">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            投稿する
          </Link>
        </div>
        <div className="posts-side-cta__illust" aria-hidden>
          <Image
            src={CTA_SHARE_ILLUST}
            alt=""
            fill
            sizes="108px"
            className="posts-side-cta__illust-img"
          />
        </div>
      </section>
    </aside>
  );
}
