"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  PanelRightClose,
  Plus,
} from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  getPrefetchedMyPosts,
  prefetchMyPosts,
} from "@/lib/prefetch-my-posts";
import { cn } from "@/lib/utils";
import { computeMyPostsStats } from "@/lib/posts/my-posts-stats";
import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import {
  buildSeasonAlbums,
  calendarMonthKey,
  listAlbumYears,
  monthCountsForYear,
  postsForYear,
  type SeasonAlbum,
} from "@/lib/posts/group-my-posts-by-season";
import { MyPostsAlbumSkeleton } from "./MyPostsAlbumSkeleton";
import { MyPostsHero } from "./MyPostsHero";
import { MyPostsYearTabs } from "./MyPostsYearTabs";
import { MyPostsAlbumStage } from "./MyPostsAlbumStage";
import { MyPostsMonthBook } from "./MyPostsMonthBook";
import { MyPostsAlbumGrid } from "./MyPostsAlbumGrid";
import { MyPostsListView } from "./MyPostsListView";
import { MyPostsSidebar } from "./MyPostsSidebar";
import type { PostMutation } from "./PostCardMenu";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";

function HostbarLeaf({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.2c5.2 7.6 7.4 14.2 0 31.2C4.8 16.4 6.8 9.8 12 2.2Z" />
      <path d="M12 8.5v18.2" />
      <path d="M12 14.2c1.7 1.1 2.6 2.4 2.8 4.2" />
      <path d="M12 19c-1.5 1-2.3 2.1-2.5 3.6" />
    </svg>
  );
}

type ViewMode = "book" | "months" | "drafts";

const EMPTY_ALBUM: SeasonAlbum = {
  spring: [],
  summer: [],
  autumn: [],
  winter: [],
};

type HostProfile = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  counts: { posts: number; followers: number; following: number };
};

export function MyPostsHubClient({ authorId }: { authorId?: string } = {}) {
  const isForeign = Boolean(authorId);
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseUser();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MyPostItem[]>([]);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>(() =>
    !isForeign && searchParams.get("view") === "drafts" ? "drafts" : "book",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const monthRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingScroll = useRef<string | null>(null);
  const recbtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (authorId) {
      let cancelled = false;
      setLoading(true);
      fetch(`/api/users/${authorId}/album`)
        .then(async (res) => {
          if (!res.ok) throw new Error("failed");
          return (await res.json()) as {
            isSelf: boolean;
            profile: {
              displayName: string;
              avatarUrl: string | null;
              bio: string | null;
            };
            counts: { posts: number; followers: number; following: number };
            items: MyPostItem[];
          };
        })
        .then((payload) => {
          if (cancelled) return;
          if (payload.isSelf || user?.id === authorId) {
            router.replace("/profile/posts");
            return;
          }
          setHost({
            displayName: payload.profile.displayName,
            avatarUrl: payload.profile.avatarUrl,
            bio: payload.profile.bio,
            counts: payload.counts,
          });
          setItems(payload.items.filter((p) => p.status !== "draft"));
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setItems([]);
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setItems([]);
      setHost(null);
      setLoading(false);
      return;
    }

    const applyItems = (arr: MyPostItem[]) => {
      setItems(arr);
      setLoading(false);
    };

    const prefetched = getPrefetchedMyPosts();
    if (prefetched) {
      applyItems(prefetched);
      return;
    }

    setLoading(true);
    void prefetchMyPosts().then((arr) => {
      applyItems(arr ?? []);
    });
  }, [user, authLoading, authorId, router]);

  const settled = !loading && !authLoading;

  const handleMutated = useCallback((id: string, change: PostMutation) => {
    setItems((prev) => {
      if ("deleted" in change) return prev.filter((p) => p.id !== id);
      return prev.map((p) =>
        p.id === id ? { ...p, status: change.status } : p,
      );
    });
  }, []);

  const sourceItems =
    !isForeign && searchParams.get("demo") === "1" ? MY_POSTS_DEMO : items;

  const years = useMemo(() => listAlbumYears(sourceItems), [sourceItems]);
  const albums = useMemo(() => buildSeasonAlbums(sourceItems), [sourceItems]);

  // 選択年の初期化・整合
  useEffect(() => {
    if (years.length === 0) return;
    if (selectedYear === null || !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear();
  const album = albums.get(activeYear) ?? EMPTY_ALBUM;
  const yearPosts = useMemo(
    () => postsForYear(sourceItems, activeYear),
    [sourceItems, activeYear],
  );
  const monthCounts = useMemo(
    () => monthCountsForYear(sourceItems, activeYear),
    [sourceItems, activeYear],
  );
  const stats = useMemo(() => computeMyPostsStats(yearPosts), [yearPosts]);
  const monthPosts = useMemo(
    () =>
      monthKey
        ? yearPosts.filter((p) => calendarMonthKey(p.createdAt) === monthKey)
        : [],
    [yearPosts, monthKey],
  );
  const drafts = useMemo(
    () => sourceItems.filter((p) => p.status === "draft"),
    [sourceItems],
  );

  // months モードに切り替わった直後にスクロール
  useEffect(() => {
    if (mode !== "months" || !pendingScroll.current) return;
    const key = pendingScroll.current;
    const t = window.setTimeout(() => {
      monthRefs.current[key]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      pendingScroll.current = null;
    }, 80);
    return () => window.clearTimeout(t);
  }, [mode, activeYear]);

  const handleYearSelect = useCallback((year: number) => {
    setSelectedYear(year);
    setMonthKey(null);
    setMode("book");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleMonthClick = useCallback((key: string) => {
    setMonthKey(key);
    setMode("book");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem("mg_album_sidebar") === "0") {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handlePointer(e: PointerEvent) {
      if (!recbtnRef.current?.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [sidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      const next = !open;
      try {
        window.localStorage.setItem("mg_album_sidebar", next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const isEmpty = settled && years.length === 0;
  const isBookView = mode === "book" && !monthKey;
  const bookVisible = settled && !isEmpty && isBookView;

  const sidebar = (
    <MyPostsSidebar
      year={activeYear}
      stats={stats}
      monthCounts={monthCounts}
      draftCount={isForeign ? 0 : drafts.length}
      onMonthClick={handleMonthClick}
      onDraftClick={() => setMode("drafts")}
      hideDrafts={isForeign}
    />
  );

  const renderRecordButton = (ref: typeof recbtnRef) => (
    <div className="my-album-recbtn-wrap" ref={ref}>
      <button
        type="button"
        className="my-album-sidebar-toggle"
        onClick={toggleSidebar}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? (
          <>
            <PanelRightClose className="h-4 w-4" aria-hidden />
            閉じる
          </>
        ) : (
          <>
            <CalendarDays className="h-4 w-4" aria-hidden />
            記録・月別
          </>
        )}
      </button>
      {sidebarOpen && (
        <div className="my-album-pop" role="dialog" aria-label="記録・月別">
          <MyPostsSidebar
            year={activeYear}
            stats={stats}
            monthCounts={monthCounts}
            draftCount={isForeign ? 0 : drafts.length}
            onMonthClick={handleMonthClick}
            onDraftClick={() => setMode("drafts")}
            hideDrafts={isForeign}
          />
        </div>
      )}
    </div>
  );

  const controls = (
    <div className="my-album-controls">
      {years.length > 0 && (
        <div className="my-album-yearbar">
          <MyPostsYearTabs
            years={years}
            selectedYear={activeYear}
            onSelect={handleYearSelect}
          />
          <p className="my-album-yearbar__caption">
            四季をめぐる、{isForeign ? "この人" : "あなた"}の物語。
          </p>
        </div>
      )}
      {renderRecordButton(recbtnRef)}
    </div>
  );

  const mainArea = () => {
    if (loading || authLoading) {
      if (isBookView) {
        return <MyPostsAlbumSkeleton />;
      }
      return (
        <div className="my-album-grid">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-[3px] bg-white/70"
            />
          ))}
        </div>
      );
    }
    if (isEmpty) {
      return (
        <div className="my-album-empty">
          <p>
            {isForeign
              ? "公開中の記録はまだありません"
              : "まだ投稿がありません"}
          </p>
          {isForeign ? null : (
            <Link href="/posts/new" className="my-album-empty__cta">
              <Plus className="h-4 w-4" aria-hidden />
              投稿を作成
            </Link>
          )}
        </div>
      );
    }
    if (mode === "drafts" && !isForeign) {
      return (
        <div className="my-album-months-view">
          <button
            type="button"
            className="my-album-back"
            onClick={() => setMode("book")}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            アルバムに戻る
          </button>
          <h2 className="my-album-months-view__title">下書き</h2>
          {drafts.length === 0 ? (
            <div className="my-album-empty">保存した下書きはありません</div>
          ) : (
            <MyPostsListView posts={drafts} onMutated={handleMutated} />
          )}
        </div>
      );
    }
    if (mode === "months") {
      return (
        <div className="my-album-months-view">
          <button
            type="button"
            className="my-album-back"
            onClick={() => setMode("book")}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            アルバムに戻る
          </button>
          <h2 className="my-album-months-view__title">
            {activeYear}年の思い出（月別）
          </h2>
          <MyPostsAlbumGrid
            posts={yearPosts}
            monthRefs={monthRefs}
            onMutated={isForeign ? undefined : handleMutated}
            showMenu={!isForeign}
          />
        </div>
      );
    }
    if (monthKey) {
      return (
        <MyPostsMonthBook
          monthKey={monthKey}
          posts={monthPosts}
          onBack={() => setMonthKey(null)}
          header={controls}
          onMutated={isForeign ? undefined : handleMutated}
          showMenu={!isForeign}
        />
      );
    }
    return (
      <MyPostsAlbumStage
        year={activeYear}
        years={years}
        yearPosts={yearPosts}
        album={album}
        recordButton={renderRecordButton(recbtnRef)}
        onYearSelect={handleYearSelect}
        onOpenMonths={() => {
          setMonthKey(null);
          setMode("months");
        }}
        onMutated={isForeign ? undefined : handleMutated}
        readOnly={isForeign}
        heading={
          isForeign && host ? `${host.displayName}のアルバム` : "マイアルバム"
        }
      />
    );
  };

  return (
    <div
      className={cn(
        "my-album-page min-h-screen",
        isBookView && "my-album-page--book",
      )}
    >
      {!isBookView && (
        <div className="my-album-mobile-only">
          <MyPostsHero
            eyebrow={isForeign ? "ALBUM" : "MY ALBUM"}
            title={
              isForeign && host
                ? `${host.displayName}のアルバム`
                : "マイアルバム"
            }
            lead={
              isForeign
                ? "残したしるしを、アルバムのように。"
                : "残したしるしを、アルバムのように。"
            }
          />
        </div>
      )}
      <div className="my-album-shell">
        {isForeign && host && authorId ? (
          <div className="my-album-hostbar">
            <div className="my-album-hostbar__avatar-wrap">
              <HostbarLeaf className="my-album-hostbar__avatar-leaf" />
              <div className="my-album-hostbar__avatar">
                <ProfileBannerAvatar
                  avatarUrl={host.avatarUrl}
                  displayName={host.displayName}
                />
              </div>
            </div>
            <ul className="my-album-hostbar__stats">
              {(
                [
                  { value: host.counts.posts, label: "投稿" },
                  { value: host.counts.followers, label: "フォロワー" },
                  { value: host.counts.following, label: "フォロー中" },
                ] as const
              ).map((item) => (
                <li key={item.label}>
                  <span className="my-album-hostbar__num">{item.value}</span>
                  <span className="my-album-hostbar__label">{item.label}</span>
                  <HostbarLeaf className="my-album-hostbar__stat-leaf" />
                </li>
              ))}
            </ul>
            <div className="my-album-hostbar__follow-wrap">
              <HostbarLeaf className="my-album-hostbar__follow-leaf my-album-hostbar__follow-leaf--left" />
              <AuthorFollowButton
                authorId={authorId}
                className="my-album-hostbar__follow"
              />
              <HostbarLeaf className="my-album-hostbar__follow-leaf my-album-hostbar__follow-leaf--right" />
            </div>
          </div>
        ) : null}
        {!bookVisible && controls}
        <div className="my-album-layout">
          <div className="my-album-feed">{mainArea()}</div>
          {/* モバイルは本の下に通常表示。PCはボタンのポップオーバーで表示 */}
          <div className="my-album-side-inline">{sidebar}</div>
        </div>
      </div>
    </div>
  );
}
