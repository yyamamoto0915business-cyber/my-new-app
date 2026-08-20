"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  SEASONS,
  type SeasonAlbum,
  type SeasonKey,
} from "@/lib/posts/group-my-posts-by-season";
import { MyAlbumCard } from "./MyAlbumCard";
import type { PostMutation } from "./PostCardMenu";

const SEASON_DECOR: Record<SeasonKey, string> = {
  spring: "/profile/album/sakura-cut.png",
  summer: "/profile/album/leaf-cluster.png",
  autumn: "/profile/album/maple-cut.png",
  winter: "/profile/album/winter-cut.png",
};

// PC見開きの読み順。モバイルは2ページに分割（春夏 / 秋冬）
const SEASON_ORDER: SeasonKey[] = ["spring", "summer", "autumn", "winter"];
const MOBILE_SEASON_PAGES: SeasonKey[][] = [
  ["spring", "summer"],
  ["autumn", "winter"],
];
const MOBILE_BREAKPOINT = "(max-width: 859px)";
const SWIPE_THRESHOLD_PX = 48;
const TURN_MS = 480;

const PREVIEW_COUNT = 3;

type Props = {
  album: SeasonAlbum;
  onSeeMore: (season: SeasonKey) => void;
  seasonRefs?: React.MutableRefObject<Record<string, HTMLElement | null>>;
  header?: React.ReactNode;
  onMutated?: (id: string, change: PostMutation) => void;
};

export function MyPostsSeasonBook({
  album,
  onSeeMore,
  seasonRefs,
  header,
  onMutated,
}: Props) {
  const [mobilePage, setMobilePage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [turnDir, setTurnDir] = useState<null | "next" | "prev">(null);
  const touchStartX = useRef<number | null>(null);
  const turningRef = useRef(false);
  const turnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current != null) window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goToPage = (next: number, dir: "next" | "prev") => {
    if (turningRef.current) return;
    if (next === mobilePage || next < 0 || next > 1) return;
    if (prefersReducedMotion()) {
      setMobilePage(next);
      return;
    }
    turningRef.current = true;
    setTurnDir(dir);
    turnTimerRef.current = window.setTimeout(() => {
      setMobilePage(next);
      setTurnDir(null);
      turningRef.current = false;
      turnTimerRef.current = null;
    }, TURN_MS);
  };

  const goNextPage = () => goToPage(mobilePage + 1, "next");
  const goPrevPage = () => goToPage(mobilePage - 1, "prev");

  const handleTouchStart = (e: React.TouchEvent) => {
    if (turningRef.current) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNextPage();
    else goPrevPage();
  };

  return (
    <div className="my-album-book">
      <div className="my-album-book__paper">
        <div className="my-album-book__rings" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Image
              key={i}
              src="/profile/album/album-ring.png"
              alt=""
              width={578}
              height={153}
              className="my-album-book__ring"
            />
          ))}
        </div>

        {header ? (
          <div className="my-album-book__toolbar">{header}</div>
        ) : null}

        {isMobile ? (
          <>
            <div
              className={`my-album-book__pages${turnDir ? ` is-turning-${turnDir}` : ""}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {MOBILE_SEASON_PAGES.map((seasons, pageIndex) => {
                const isCurrent = pageIndex === mobilePage;
                const isEntering =
                  (turnDir === "next" && pageIndex === mobilePage + 1) ||
                  (turnDir === "prev" && pageIndex === mobilePage - 1);
                const isLeaving = Boolean(turnDir) && isCurrent;
                const pageClass = [
                  "my-album-book__page",
                  isCurrent ? "is-current" : "",
                  isLeaving && turnDir === "next" ? "is-leaving-next" : "",
                  isLeaving && turnDir === "prev" ? "is-leaving-prev" : "",
                  isEntering && turnDir === "next" ? "is-entering-next" : "",
                  isEntering && turnDir === "prev" ? "is-entering-prev" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={pageIndex}
                    className={pageClass}
                    aria-hidden={!isCurrent && !isEntering}
                  >
                    {seasons.map((s) => (
                      <SeasonBlock
                        key={s}
                        season={s}
                        posts={album[s]}
                        onSeeMore={onSeeMore}
                        seasonRefs={seasonRefs}
                        onMutated={onMutated}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            <nav className="my-album-book__pager" aria-label="アルバムのページ">
              <button
                type="button"
                className="my-album-book__pager-btn my-album-book__pager-btn--prev"
                onClick={goPrevPage}
                disabled={mobilePage === 0 || Boolean(turnDir)}
                aria-label="前のページ（春・夏）"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                春・夏
              </button>
              <span className="my-album-book__pager-num" aria-current="page">
                {mobilePage + 1} / 2
              </span>
              <button
                type="button"
                className="my-album-book__pager-btn my-album-book__pager-btn--next"
                onClick={goNextPage}
                disabled={mobilePage === 1 || Boolean(turnDir)}
                aria-label="次のページ（秋・冬）"
              >
                <span className="my-album-book__pager-corner" aria-hidden />
                <span className="my-album-book__pager-corner-label">秋・冬</span>
              </button>
            </nav>
          </>
        ) : (
          <div className="my-album-book__spread">
            {SEASON_ORDER.map((s) => (
              <SeasonBlock
                key={s}
                season={s}
                posts={album[s]}
                onSeeMore={onSeeMore}
                seasonRefs={seasonRefs}
                onMutated={onMutated}
              />
            ))}
          </div>
        )}

        <Image
          src="/profile/album/maple-cut.png"
          alt=""
          width={90}
          height={90}
          className="my-album-book__accent"
          aria-hidden
        />
      </div>
    </div>
  );
}

function SeasonBlock({
  season,
  posts,
  onSeeMore,
  seasonRefs,
  onMutated,
}: {
  season: SeasonKey;
  posts: MyPostItem[];
  onSeeMore: (season: SeasonKey) => void;
  seasonRefs?: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onMutated?: (id: string, change: PostMutation) => void;
}) {
  const meta = SEASONS.find((s) => s.key === season)!;
  const preview = posts.slice(0, PREVIEW_COUNT);
  const hasMore = posts.length > PREVIEW_COUNT;

  return (
    <section
      className={`my-album-season my-album-season--${season}`}
      data-empty={preview.length === 0}
      ref={(el) => {
        if (seasonRefs) seasonRefs.current[season] = el;
      }}
    >
      <span className="my-album-season__tape" aria-hidden />
      <header className="my-album-season__head">
        <h3 className="my-album-season__label">{meta.label}</h3>
        <Image
          src={SEASON_DECOR[season]}
          alt=""
          width={32}
          height={32}
          className="my-album-season__decor my-album-season__decor--sm"
          aria-hidden
        />
        <span className="my-album-season__months">{meta.months}</span>
        <Image
          src={SEASON_DECOR[season]}
          alt=""
          width={80}
          height={80}
          className="my-album-season__decor my-album-season__decor--lg"
          aria-hidden
        />
      </header>

      {preview.length === 0 ? (
        <Link href="/posts/new" className="my-album-season__empty">
          この季節の記録を残す
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      ) : (
        <div className="my-album-season__grid">
          {preview.map((post) => (
            <MyAlbumCard key={post.id} post={post} onMutated={onMutated} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className="my-album-season__more"
          onClick={() => onSeeMore(season)}
        >
          もっと見る（{posts.length}件）
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </section>
  );
}
