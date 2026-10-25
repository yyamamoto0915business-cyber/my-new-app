"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyPostFilters,
  collectPostAreas,
  POST_CATEGORY_TABS,
  POST_DATE_OPTIONS,
  POST_SORT_OPTIONS,
  type CommunityPost,
  type PostCategoryTab,
  type PostDateKey,
  type PostSortKey,
} from "@/lib/posts/mock-feed";
import { fetchJsonArray } from "@/lib/fetch-json-array";
import { PostsHero } from "@/components/posts/PostsHero";
import { PostsGrid } from "@/components/posts/PostsGrid";
import { PostsSidebar } from "@/components/posts/PostsSidebar";
import { PostsSearch } from "@/components/posts/PostsSearch";
import { PostsViewer } from "@/components/posts/PostsViewer";
import {
  PostsDiscoverFooter,
  PostsFollowingStories,
} from "@/components/posts/PostsDiscover";
import { collectPopularTags, postMatchesArea } from "@/lib/posts/area-label";
import styles from "./PostsExplore.module.css";

/** グリッドに一度に足す件数（3 列 × 8 行） */
const GRID_PAGE_SIZE = 24;

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

function PostsCategoryChips({
  category,
  onCategoryChange,
}: {
  category: PostCategoryTab;
  onCategoryChange: (c: PostCategoryTab) => void;
}) {
  return (
    <div className={styles.chips} role="tablist" aria-label="投稿カテゴリ">
      {POST_CATEGORY_TABS.map((tab) => {
        const active = category === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onCategoryChange(tab.key)}
            className={cn(styles.chip, active && styles.chipActive)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
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
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
  /** 全画面ビューア：一覧から開くときは null（絞り込み結果を使う） */
  const [viewer, setViewer] = useState<{
    posts: CommunityPost[] | null;
    index: number;
  } | null>(null);
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
    () =>
      applyPostFilters(apiPosts, {
        category,
        sort,
        date: dateKey,
        // 「#カフェ」でもタグに当たるよう先頭の # は外す
        query: query.trim().replace(/^[#＃]/, ""),
      }).filter((post) => postMatchesArea(post, area)),
    [apiPosts, category, area, sort, dateKey, query],
  );

  useEffect(() => {
    setVisibleCount(GRID_PAGE_SIZE);
  }, [category, area, sort, dateKey, query]);

  const loadMore = useCallback(
    () => setVisibleCount((c) => c + GRID_PAGE_SIZE),
    [],
  );
  const closeViewer = useCallback(() => setViewer(null), []);
  const openFromGrid = useCallback(
    (index: number) => setViewer({ posts: null, index }),
    [],
  );
  const popularTags = useMemo(() => collectPopularTags(apiPosts, 8), [apiPosts]);

  const renderGrid = () => (
    <PostsGrid
      posts={posts}
      loading={loading}
      loadError={loadError}
      onRetry={() => void loadPosts(category)}
      onOpen={openFromGrid}
      visibleCount={visibleCount}
      onLoadMore={loadMore}
    />
  );

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
        <PostsSearch value={query} onQueryChange={setQuery} />
        <div className="posts-hero-stack">
          <PostsHero />
          <PostsCategoryTabs
            category={category}
            onCategoryChange={setCategory}
          />
        </div>

        {renderFilterBar()}

        <div className="posts-board-layout">
          <section aria-label="投稿一覧">{renderGrid()}</section>
          <PostsSidebar posts={apiPosts} />
        </div>
      </main>

      {/* Mobile */}
      <main className={cn("posts-board-main posts-board-main--mobile", styles.mobileMain)}>
        <div className={styles.mobileTop}>
          <div className={styles.mobileTitleRow}>
            <h1 className={styles.mobileTitle}>みんなの投稿</h1>
            <span className={styles.mobileLead}>みんなで見つける、まちの魅力</span>
          </div>
          <PostsSearch value={query} onQueryChange={setQuery} />
          <PostsFollowingStories
            onOpen={(story) => setViewer({ posts: story.posts, index: 0 })}
          />
          <PostsCategoryChips category={category} onCategoryChange={setCategory} />
        </div>

        <section aria-label="投稿一覧">{renderGrid()}</section>

        {!loading ? (
          <PostsDiscoverFooter
            tags={popularTags}
            onTagSelect={(tag) => {
              setQuery(tag);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : null}

        <Link href="/posts/new" className={styles.fab}>
          <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          投稿する
        </Link>
      </main>

      {viewer ? (
        <PostsViewer
          posts={viewer.posts ?? posts}
          startIndex={viewer.index}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  );
}
