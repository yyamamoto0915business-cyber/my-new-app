"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Plus,
  SlidersHorizontal,
  Sprout,
} from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  SEASONS,
  seasonOfPost,
  type SeasonAlbum,
  type SeasonKey,
} from "@/lib/posts/group-my-posts-by-season";
import {
  POST_CATEGORY_TABS,
  type PostCategory,
} from "@/lib/posts/mock-feed";
import { MyAlbumMemoryCard } from "./MyAlbumMemoryCard";
import type { PostMutation } from "./PostCardMenu";

const BOOK_SRC = "/profile/album/book-stage.png";
const LEAVES_LEFT = "/profile/album/leaves-left.png";
const MAPLE = "/profile/album/maple-cut.png";
const TITLE_SPRIG = "/profile/album/title-sprig.png";

const SEASON_ICON: Record<SeasonKey, string> = {
  spring: "/profile/album/season-icon-spring.png",
  summer: "/profile/album/season-icon-summer.png",
  autumn: "/profile/album/season-icon-autumn.png",
  winter: "/profile/album/season-icon-winter.png",
};

const VISIBLE_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;
const FILM_WINDOW = 8;
const DOT_WINDOW = 9;
const SWIPE_PX = 48;

type SeasonFilter = "all" | SeasonKey;
type CategoryFilter = "all" | PostCategory;

type Props = {
  year: number;
  years: number[];
  yearPosts: MyPostItem[];
  album: SeasonAlbum;
  recordButton: ReactNode;
  onYearSelect: (year: number) => void;
  onOpenMonths: () => void;
  onMutated?: (id: string, change: PostMutation) => void;
};

function formatThumbDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${month}/${day}`;
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function windowStart(length: number, index: number, size: number): number {
  if (length <= size) return 0;
  return Math.max(0, Math.min(index - Math.floor((size - 1) / 2), length - size));
}

function BlankMemoryCard() {
  return (
    <div className="my-album-memory my-album-memory--blank">
      <p className="my-album-memory__blank-kicker">まだ白いページ</p>
      <span className="my-album-memory__photo my-album-memory__photo--blank">
        <Plus className="h-6 w-6" aria-hidden />
      </span>
      <p className="my-album-memory__blank-cta">次の記録を残す</p>
    </div>
  );
}

function AlbumFilterMenu({
  label,
  value,
  options,
  onChange,
  leading,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  leading?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value)?.label ?? label;

  useEffect(() => {
    if (!open) return;
    function onPointer(e: globalThis.PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="my-album-stage__menu" ref={wrapRef}>
      <button
        type="button"
        className="my-album-stage__select"
        data-leading={leading ? "true" : undefined}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        {leading ? (
          <span className="my-album-stage__select-icon" aria-hidden>
            {leading}
          </span>
        ) : null}
        {current}
      </button>
      {open ? (
        <ul className="my-album-stage__menu-list" role="listbox" aria-label={label}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MyPostsAlbumStage({
  year,
  years,
  yearPosts,
  album,
  recordButton,
  onYearSelect,
  onOpenMonths,
  onMutated,
}: Props) {
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const drag = useRef<{ x: number; active: boolean; moved: boolean }>({
    x: 0,
    active: false,
    moved: false,
  });
  const thumbRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const posts = useMemo(() => {
    let list =
      season === "all"
        ? yearPosts
        : yearPosts.filter((p) => seasonOfPost(p.createdAt) === season);
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    return [...list].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );
  }, [yearPosts, season, category]);

  useEffect(() => {
    if (season === "all") return;
    if (album[season].length === 0) setSeason("all");
  }, [album, season]);

  useEffect(() => {
    setIndex(0);
  }, [year, season, category]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 859px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIndex((i) => {
      if (posts.length === 0) return 0;
      return Math.min(i, posts.length - 1);
    });
  }, [posts.length]);

  const current = posts[index] ?? null;
  const filmStart = windowStart(posts.length, index, FILM_WINDOW);
  const filmPosts = posts.slice(filmStart, filmStart + FILM_WINDOW);
  const filmRest = Math.max(0, posts.length - (filmStart + filmPosts.length));
  const dotStart = windowStart(posts.length, index, DOT_WINDOW);
  const dotCount = Math.min(DOT_WINDOW, posts.length);

  useEffect(() => {
    if (!current) return;
    thumbRefs.current[current.id]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [current]);

  const goTo = useCallback(
    (next: number) => {
      if (posts.length === 0) return;
      setIndex(wrapIndex(next, posts.length));
    },
    [posts.length],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        ".my-album-pop, .my-album-stage__menu, .post-card-menu, .my-album-memory__hit, a, [data-no-swipe]",
      )
    ) {
      return;
    }
    drag.current = { x: e.clientX, active: true, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    if (Math.abs(e.clientX - drag.current.x) > 8) {
      drag.current.moved = true;
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.x;
    const moved = drag.current.moved;
    drag.current.active = false;
    if (Math.abs(delta) >= SWIPE_PX) {
      if (delta < 0) goNext();
      else goPrev();
    }
    if (moved) {
      window.setTimeout(() => {
        drag.current.moved = false;
      }, 0);
    }
  };

  const handleCardsClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const seasonCounts = useMemo(
    () => ({
      spring: album.spring.length,
      summer: album.summer.length,
      autumn: album.autumn.length,
      winter: album.winter.length,
    }),
    [album],
  );

  const activeSeason = SEASONS.find((s) => s.key === season);
  const countLabel =
    season === "all"
      ? isMobile
        ? `全${posts.length}件`
        : `全${posts.length}件の投稿`
      : isMobile
        ? `${activeSeason?.label ?? ""} ${posts.length}件`
        : `${activeSeason?.label ?? ""}の投稿 ${posts.length}件`;
  const seasonFilterIcon =
    season === "all" ? (
      <Sprout className="h-3.5 w-3.5" />
    ) : (
      <Image
        src={SEASON_ICON[season]}
        alt=""
        width={16}
        height={16}
      />
    );

  return (
    <section className="my-album-stage" aria-label="投稿をアルバムのように見る">
      <div className="my-album-stage__flora my-album-stage__flora--left" aria-hidden>
        <Image src={LEAVES_LEFT} alt="" fill sizes="280px" className="object-contain object-left-bottom" />
      </div>
      <div className="my-album-stage__flora my-album-stage__flora--right" aria-hidden>
        <Image src={MAPLE} alt="" width={160} height={180} />
      </div>

      <div className="my-album-stage__toolbar">
        <div className="my-album-stage__brand">
          <h1 className="my-album-stage__title">
            マイアルバム
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={36}
              height={56}
              className="my-album-stage__sprig"
              aria-hidden
            />
          </h1>
          <p className="my-album-stage__lead">思い出は、まちの宝もの。</p>
        </div>
        <div className="my-album-stage__filters">
          <AlbumFilterMenu
            label="年"
            value={String(year)}
            options={years.map((y) => ({ value: String(y), label: `${y}年` }))}
            onChange={(next) => onYearSelect(Number(next))}
          />
          <AlbumFilterMenu
            label="季節"
            value={season}
            leading={seasonFilterIcon}
            options={[
              { value: "all", label: isMobile ? "季節" : "すべての季節" },
              ...SEASONS.map((s) => ({
                value: s.key,
                label: isMobile ? s.label : `${s.label}（${s.months}）`,
              })),
            ]}
            onChange={(next) => setSeason(next as SeasonFilter)}
          />
          <AlbumFilterMenu
            label="投稿の種類"
            value={category}
            leading={<SlidersHorizontal className="h-3.5 w-3.5" />}
            options={POST_CATEGORY_TABS.map((tab) => ({
              value: tab.key,
              label:
                tab.key === "all"
                  ? isMobile
                    ? "種類"
                    : "すべての投稿"
                  : tab.label,
            }))}
            onChange={(next) => setCategory(next as CategoryFilter)}
          />
        </div>
        <p className="my-album-stage__count">{countLabel}</p>
        <div className="my-album-stage__record">{recordButton}</div>
      </div>

      <div className="my-album-stage__main">
          <button
            type="button"
            className="my-album-stage__arrow"
            onClick={goPrev}
            disabled={posts.length < 2}
            aria-label="前の記録"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>

          <div
            className="my-album-stage__scene"
            role="group"
            aria-roledescription="carousel"
            aria-label={`${year}年の記録`}
          >
            <div className="my-album-stage__book" aria-hidden>
              <Image
                src={BOOK_SRC}
                alt=""
                width={1516}
                height={904}
                className="my-album-stage__book-img"
                priority
              />
            </div>
            <span className="my-album-stage__glow" aria-hidden />
            <div
              className="my-album-stage__cards"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClickCapture={handleCardsClickCapture}
            >
              {VISIBLE_OFFSETS.map((offset) => {
                if (posts.length === 0 && offset !== 0) return null;
                const raw = index + offset;
                const canWrap = posts.length > VISIBLE_OFFSETS.length;
                const i = canWrap ? wrapIndex(raw, posts.length) : raw;
                const post =
                  i >= 0 && i < posts.length ? posts[i] : null;
                const active = offset === 0;
                if (!post && offset !== 0) return null;
                return (
                  <div
                    key={post ? `${post.id}-${offset}` : `blank-${offset}`}
                    className="my-album-stage__slot"
                    data-pos={String(offset)}
                    data-active={active ? "true" : "false"}
                    data-empty={post ? "false" : "true"}
                  >
                    {post ? (
                      <MyAlbumMemoryCard
                        post={post}
                        active={active}
                        interactive={active}
                        onMutated={onMutated}
                      />
                    ) : (
                      <Link
                        href="/posts/new"
                        className="my-album-stage__slot-hit"
                        aria-label="次の記録を残す"
                      >
                        <BlankMemoryCard />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="my-album-stage__arrow"
            onClick={goNext}
            disabled={posts.length < 2}
            aria-label="次の記録"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>

      <p className="my-album-stage__hint">
        左右にスワイプして思い出をめくってみましょう
      </p>

      {posts.length > 1 ? (
        <div className="my-album-stage__dots" role="tablist" aria-label="記録の位置">
          {Array.from({ length: dotCount }, (_, offset) => {
            const i = dotStart + offset;
            const post = posts[i];
            if (!post) return null;
            return (
              <button
                key={post.id}
                type="button"
                role="tab"
                className={`my-album-stage__dot${i === index ? " is-active" : ""}`}
                aria-label={`${i + 1}枚目`}
                aria-selected={i === index}
                onClick={() => setIndex(i)}
              />
            );
          })}
        </div>
      ) : null}

      <div className="my-album-stage__film" aria-label="記録の年表">
          <button
            type="button"
            className="my-album-stage__film-nav"
            onClick={goPrev}
            disabled={posts.length < 2}
            aria-label="前のサムネイル"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="my-album-stage__film-track">
            {filmPosts.map((post, offset) => {
              const i = filmStart + offset;
              return (
              <button
                key={post.id}
                type="button"
                className="my-album-stage__thumb"
                data-active={i === index ? "true" : "false"}
                onClick={() => setIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={`${formatThumbDate(post.createdAt)} ${post.title}`}
                ref={(el) => {
                  thumbRefs.current[post.id] = el;
                }}
              >
                <span className="my-album-stage__thumb-photo">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  ) : null}
                </span>
                <span className="my-album-stage__thumb-date">
                  {formatThumbDate(post.createdAt)}
                </span>
              </button>
              );
            })}
            {filmRest > 0 ? (
              <button
                type="button"
                className="my-album-stage__thumb my-album-stage__thumb--more"
                onClick={() => setIndex(filmStart + filmPosts.length)}
                aria-label={`ほか${filmRest}件を見る`}
              >
                <span className="my-album-stage__thumb-photo">
                  +{filmRest}件
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </button>
            ) : (
              <Link
                href="/posts/new"
                className="my-album-stage__thumb my-album-stage__thumb--add"
                aria-label="新しい記録を残す"
              >
                <span className="my-album-stage__thumb-photo">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="my-album-stage__thumb-date">記録</span>
              </Link>
            )}
          </div>
          <button
            type="button"
            className="my-album-stage__film-nav"
            onClick={goNext}
            disabled={posts.length < 2}
            aria-label="次のサムネイル"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

      <div className="my-album-stage__bar">
        <button
          type="button"
          className={`my-album-stage__chip${season === "all" ? " is-on" : ""}`}
          onClick={() => setSeason("all")}
        >
          <Sprout className="h-4 w-4" aria-hidden />
          季節で見る
        </button>
        <div className="my-album-stage__seasons" role="tablist" aria-label="季節">
          {SEASONS.map((s) => {
            const on = season === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={on}
                className={`my-album-stage__season my-album-stage__season--${s.key}${on ? " is-active" : ""}`}
                onClick={() => setSeason(on ? "all" : s.key)}
              >
                <span className="my-album-stage__season-head">
                  <Image
                    src={SEASON_ICON[s.key]}
                    alt=""
                    width={20}
                    height={20}
                    className="my-album-stage__season-icon"
                    aria-hidden
                  />
                  <span className="my-album-stage__season-label">{s.label}</span>
                </span>
                <span className="my-album-stage__season-range">{s.months}</span>
                <span className="sr-only">{seasonCounts[s.key]}件</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="my-album-stage__chip"
          onClick={onOpenMonths}
        >
          <Images className="h-4 w-4" aria-hidden />
          アルバム一覧
        </button>
        </div>
    </section>
  );
}
