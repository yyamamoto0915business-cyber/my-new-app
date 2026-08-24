"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Images, Play } from "lucide-react";
import { fetchJsonArray } from "@/lib/fetch-json-array";
import type { CommunityPost } from "@/lib/posts/mock-feed";
import { formatVideoDuration } from "@/lib/posts/post-video";
import { FeedLoadError } from "@/components/home/FeedLoadError";

/** みんなの投稿（タイトル付きカードの横スクロール） */
export function TownGallery() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void fetchJsonArray<CommunityPost>("/api/posts?limit=14").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPosts(result.data);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setReloadKey((n) => n + 1);
  }, []);

  return (
    <section
      aria-label="みんなの投稿"
      className="overflow-hidden rounded-[16px] border border-[#e6ddd0] bg-[#fbf7f0] p-4 min-[900px]:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Images className="h-4 w-4 text-[#b07a3a]" aria-hidden />
          <h2
            className="text-[15px] font-semibold text-[#3a2a18]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            みんなの投稿
          </h2>
        </div>
        <Link
          href="/posts"
          className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#b07a3a] hover:underline"
        >
          もっと見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square w-[116px] shrink-0 animate-pulse rounded-[10px] bg-[#efe6d8] min-[900px]:w-[132px]"
            />
          ))}
        </div>
      ) : error && posts.length === 0 ? (
        <FeedLoadError
          message="みんなの投稿を読み込めませんでした"
          onRetry={retry}
        />
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#8a7a68]">
          まだ投稿がありません
        </p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {posts.map((post) => {
            const isVideo = Boolean(post.videoUrl);
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group w-[116px] shrink-0 min-[900px]:w-[132px]"
              >
                <div className="relative aspect-square overflow-hidden rounded-[10px] bg-[#efe6d8] ring-1 ring-[#e6ddd0]">
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9a7a58]">
                      {post.categoryLabel}
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                    aria-hidden
                  />
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 px-2 pb-1.5 text-[11px] font-medium leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                    {post.title}
                  </p>
                  {isVideo && (
                    <>
                      <span
                        className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3a2a18] shadow-sm"
                        aria-hidden
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                      {post.durationSec != null && (
                        <span className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
                          {formatVideoDuration(post.durationSec)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
