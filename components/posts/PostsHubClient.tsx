"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyPostFilters,
  collectPostAreas,
  filterCommunityPosts,
  POST_CATEGORY_TABS,
  POST_DATE_OPTIONS,
  POST_SORT_OPTIONS,
  type CommunityPost,
  type PostCategoryTab,
  type PostDateKey,
  type PostSortKey,
} from "@/lib/posts/mock-feed";
import { fetchJsonArray } from "@/lib/fetch-json-array";
import { POSTS_HERO_DESC_LINES, PostsHero } from "@/components/posts/PostsHero";
import { PostsFeedCard } from "@/components/posts/PostsFeedCard";
import { PostsSidebar } from "@/components/posts/PostsSidebar";

const FEATURED_POST_LIMIT = 8;

type FilterOption = { key: string; label: string };

function PostsFilterDropdown({
  baseLabel,
  options,
  value,
  defaultKey,
  open,
  onToggle,
  onSelect,
}: {
  baseLabel: string;
  options: FilterOption[];
  value: string;
  defaultKey: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
}) {
  const isDefault = value === defaultKey;
  const current = options.find((o) => o.key === value);
  const display = isDefault ? baseLabel : current?.label ?? baseLabel;

  return (
    <div className="posts-filter-dd">
      <button
        type="button"
        className={cn(
          "posts-filter-btn",
          (!isDefault || open) && "posts-filter-btn--active",
        )}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {display}
        <ChevronDown
          className={cn(
            "h-3 w-3 opacity-70 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="posts-filter-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="option"
              aria-selected={value === o.key}
              className={cn(
                "posts-filter-menu__item",
                value === o.key && "posts-filter-menu__item--active",
              )}
              onClick={() => onSelect(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PostsCategoryTabs({
  category,
  onCategoryChange,
  mobile,
}: {
  category: PostCategoryTab;
  onCategoryChange: (c: PostCategoryTab) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={cn("posts-tabs-rail", mobile && "posts-tabs-rail--mobile")}
      role="tablist"
      aria-label="投稿カテゴリ"
    >
      <div className={cn("posts-tabs", mobile && "posts-tabs--scroll")}>
        {POST_CATEGORY_TABS.map((tab) => {
          const active = category === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onCategoryChange(tab.key)}
              className={cn("posts-tab", active && "posts-tab--active")}
            >
              <span className="posts-tab__pin" aria-hidden />
              <span className="posts-tab__label">{tab.label}</span>
              <span className="posts-tab__flourish" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostsFeaturedSection({
  posts,
  mobile,
  loading,
  loadError,
  onRetry,
  mobileVisibleCount = FEATURED_POST_LIMIT,
  onMobileLoadMore,
}: {
  posts: ReturnType<typeof filterCommunityPosts>;
  mobile?: boolean;
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  mobileVisibleCount?: number;
  onMobileLoadMore?: () => void;
}) {
  const visibleCount = mobile ? mobileVisibleCount : FEATURED_POST_LIMIT;
  const featured = posts.slice(0, visibleCount);
  const hasMore = posts.length > featured.length;

  return (
    <section aria-label="注目の投稿" className={mobile ? "space-y-2.5" : "space-y-3"}>
      <div className="flex items-end justify-between px-0.5">
        <h2 className="posts-section-title">注目の投稿</h2>
        <Link href="/posts" className="posts-section-more">
          もっと見る →
        </Link>
      </div>
      {loading ? (
        <p className="posts-empty">投稿を読み込んでいます…</p>
      ) : loadError && featured.length === 0 ? (
        <div className="posts-empty space-y-3">
          <p>投稿を読み込めませんでした</p>
          {onRetry ? (
            <button type="button" className="posts-load-more__btn" onClick={onRetry}>
              再読み込み
            </button>
          ) : null}
        </div>
      ) : featured.length === 0 ? (
        <p className="posts-empty">条件に合う投稿はまだありません</p>
      ) : (
        <>
          <div className={cn("posts-grid", mobile && "posts-grid--mobile")}>
            {featured.map((post, i) => (
              <PostsFeedCard key={post.id} post={post} index={i} />
            ))}
          </div>
          {!mobile && posts.length > 0 ? (
            <div className="posts-load-more">
              <button type="button" className="posts-load-more__btn">
                もっと見る
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
          {mobile && hasMore ? (
            <div className="posts-load-more">
              <button
                type="button"
                className="posts-load-more__btn"
                onClick={onMobileLoadMore}
              >
                もっと見る
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export function PostsHubClient() {
  const [category, setCategory] = useState<PostCategoryTab>("all");
  const [area, setArea] = useState<string>("");
  const [sort, setSort] = useState<PostSortKey>("popular");
  const [dateKey, setDateKey] = useState<PostDateKey>("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);
  const [apiPosts, setApiPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] =
    useState(FEATURED_POST_LIMIT);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (cat: PostCategoryTab) => {
    setLoading(true);
    setLoadError(false);
    const qs = cat !== "all" ? `?category=${encodeURIComponent(cat)}` : "";
    const result = await fetchJsonArray<CommunityPost>(`/api/posts${qs}`);
    if (result.ok) {
      setApiPosts(result.data);
      setLoadError(false);
    } else {
      setLoadError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPosts(category);
  }, [category, loadPosts]);

  useEffect(() => {
    if (!openFilter) return;
    function handlePointer(e: PointerEvent) {
      if (!filterBarRef.current?.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [openFilter]);

  const areaOptions = useMemo<FilterOption[]>(
    () => [
      { key: "", label: "すべてのエリア" },
      ...collectPostAreas(apiPosts).map((a) => ({ key: a, label: a })),
    ],
    [apiPosts],
  );

  const categoryOptions = useMemo<FilterOption[]>(
    () => POST_CATEGORY_TABS.map((t) => ({ key: t.key, label: t.label })),
    [],
  );

  const posts = useMemo(
    () => applyPostFilters(apiPosts, { category, area, sort, date: dateKey }),
    [apiPosts, category, area, sort, dateKey],
  );

  useEffect(() => {
    setMobileVisibleCount(FEATURED_POST_LIMIT);
  }, [category, area, sort, dateKey]);

  const toggleFilter = useCallback((key: string) => {
    setOpenFilter((prev) => (prev === key ? null : key));
  }, []);

  const renderFilterBar = () => (
    <div className="posts-filter-bar" ref={filterBarRef}>
      <div className="flex flex-wrap items-center gap-2">
        <PostsFilterDropdown
          baseLabel="エリア"
          options={areaOptions}
          value={area}
          defaultKey=""
          open={openFilter === "area"}
          onToggle={() => toggleFilter("area")}
          onSelect={(key) => {
            setArea(key);
            setOpenFilter(null);
          }}
        />
        <PostsFilterDropdown
          baseLabel="カテゴリ"
          options={categoryOptions}
          value={category}
          defaultKey="all"
          open={openFilter === "category"}
          onToggle={() => toggleFilter("category")}
          onSelect={(key) => {
            setCategory(key as PostCategoryTab);
            setOpenFilter(null);
          }}
        />
        <PostsFilterDropdown
          baseLabel="人気順"
          options={POST_SORT_OPTIONS}
          value={sort}
          defaultKey="popular"
          open={openFilter === "sort"}
          onToggle={() => toggleFilter("sort")}
          onSelect={(key) => {
            setSort(key as PostSortKey);
            setOpenFilter(null);
          }}
        />
        <PostsFilterDropdown
          baseLabel="投稿日"
          options={POST_DATE_OPTIONS}
          value={dateKey}
          defaultKey="all"
          open={openFilter === "date"}
          onToggle={() => toggleFilter("date")}
          onSelect={(key) => {
            setDateKey(key as PostDateKey);
            setOpenFilter(null);
          }}
        />
      </div>
      <label className="posts-notify">
        <span>新着通知を受け取る</span>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          onClick={() => setNotify((v) => !v)}
          className={cn(
            "posts-notify__switch",
            notify && "posts-notify__switch--on",
          )}
        >
          <span className="posts-notify__knob" />
        </button>
      </label>
    </div>
  );

  return (
    <div className="posts-board-page">
      {/* PC */}
      <main className="posts-board-main posts-board-main--pc">
        <div className="posts-hero-stack">
          <PostsHero />
          <PostsCategoryTabs
            category={category}
            onCategoryChange={setCategory}
          />
        </div>

        {renderFilterBar()}

        <div className="posts-board-layout">
          <PostsFeaturedSection
            posts={posts}
            loading={loading}
            loadError={loadError}
            onRetry={() => void loadPosts(category)}
          />
          <PostsSidebar posts={apiPosts} />
        </div>
      </main>

      {/* Mobile */}
      <main className="posts-board-main posts-board-main--mobile">
        <div className="posts-hero-stack posts-hero-stack--mobile">
          <PostsHero compact />
          <PostsCategoryTabs
            category={category}
            onCategoryChange={setCategory}
            mobile
          />
        </div>

        <p className="posts-mobile-lead">
          {POSTS_HERO_DESC_LINES.map((line) => (
            <span key={line} className="posts-mobile-lead__line">
              {line}
            </span>
          ))}
        </p>

        <PostsFeaturedSection
          posts={posts}
          mobile
          loading={loading}
          loadError={loadError}
          onRetry={() => void loadPosts(category)}
          mobileVisibleCount={mobileVisibleCount}
          onMobileLoadMore={() =>
            setMobileVisibleCount((c) => c + FEATURED_POST_LIMIT)
          }
        />
      </main>
    </div>
  );
}
