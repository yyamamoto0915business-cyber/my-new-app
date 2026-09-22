"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  getPrefetchedMyPosts,
  prefetchMyPosts,
} from "@/lib/prefetch-my-posts";
import {
  prefetchMypageSummary,
  type MypageSummaryResponse,
} from "@/lib/prefetch-mypage-summary";
import { cn } from "@/lib/utils";
import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import { listAlbumYears } from "@/lib/posts/group-my-posts-by-season";
import {
  filterAlbumPosts,
  handleFromEmail,
  type AlbumCategoryFilter,
  type AlbumHubTab,
  type AlbumSeasonFilter,
  type AlbumSortKey,
  type AlbumStatusFilter,
} from "@/lib/posts/my-album-view";
import { useOrganizerPro } from "@/lib/organizer-pro-store";
import type { PostMutation } from "./PostCardMenu";
import {
  MyAlbumProfileHeader,
  MyAlbumProfileSkeleton,
  type AlbumProfile,
} from "./MyAlbumProfileHeader";
import { MyAlbumSeasonBar } from "./MyAlbumSeasonBar";
import { MyAlbumFilterBar } from "./MyAlbumFilterBar";
import { MyAlbumViewTabs } from "./MyAlbumViewTabs";
import { MyAlbumMediaGrid } from "./MyAlbumMediaGrid";
import { MyAlbumMapPane } from "./MyAlbumMapPane";
import { MySharedAlbumsPane } from "./MySharedAlbumsPane";

type HostProfile = AlbumProfile;

function tabFromSearch(value: string | null): AlbumHubTab {
  if (value === "album" || value === "map") return value;
  return "posts";
}

export function MyPostsHubClient({ authorId }: { authorId?: string } = {}) {
  const isForeign = Boolean(authorId);
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseUser();
  const isPro = useOrganizerPro();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MyPostItem[]>([]);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [selfProfile, setSelfProfile] = useState<AlbumProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [tab, setTab] = useState<AlbumHubTab>(() => {
    if (searchParams.get("join") || searchParams.get("album")) return "album";
    if (!isForeign && searchParams.get("view") === "drafts") return "posts";
    return tabFromSearch(searchParams.get("tab"));
  });
  const [season, setSeason] = useState<AlbumSeasonFilter>("all");
  const [category, setCategory] = useState<AlbumCategoryFilter>("all");
  const [sort, setSort] = useState<AlbumSortKey>("new");
  const [status, setStatus] = useState<AlbumStatusFilter>(() =>
    !isForeign && searchParams.get("view") === "drafts" ? "draft" : "all",
  );
  const [albumDetailOpen, setAlbumDetailOpen] = useState(false);

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
              region?: string | null;
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
            region: payload.profile.region ?? null,
            handle: null,
            isPro: false,
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
      setSelfProfile(null);
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
    } else {
      setLoading(true);
      void prefetchMyPosts().then((arr) => {
        applyItems(arr ?? []);
      });
    }

    let cancelled = false;
    void prefetchMypageSummary().then((data: MypageSummaryResponse | null) => {
      if (cancelled || !data) return;
      setSelfProfile({
        displayName: data.profile.displayName,
        avatarUrl: data.profile.avatarUrl,
        bio: data.profile.bio,
        region: data.profile.region,
        handle: handleFromEmail(user.email),
        isPro,
        counts: {
          posts: data.stats.posts,
          followers: data.stats.followers,
          following: data.stats.following,
        },
      });
    });
    return () => {
      cancelled = true;
    };
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

  const demoMode = !isForeign && searchParams.get("demo") === "1";
  const sourceItems = demoMode ? MY_POSTS_DEMO : items;

  const years = useMemo(() => listAlbumYears(sourceItems), [sourceItems]);

  const visiblePosts = useMemo(
    () =>
      filterAlbumPosts(sourceItems, {
        season,
        category,
        year: selectedYear,
        status,
        sort,
        includeDrafts: false,
      }),
    [sourceItems, season, category, selectedYear, status, sort],
  );

  const profile: AlbumProfile | null = isForeign
    ? host
    : selfProfile
      ? {
          ...selfProfile,
          isPro,
          handle: selfProfile.handle ?? handleFromEmail(user?.email),
          counts: {
            ...selfProfile.counts,
            posts:
              sourceItems.filter((p) => p.status !== "draft").length ||
              selfProfile.counts.posts,
          },
        }
      : user
        ? {
            displayName:
              (user.user_metadata?.display_name as string | undefined) ??
              user.email?.split("@")[0] ??
              "あなた",
            avatarUrl: null,
            bio: null,
            region: null,
            handle: handleFromEmail(user.email),
            isPro,
            counts: {
              posts: sourceItems.filter((p) => p.status !== "draft").length,
              followers: 0,
              following: 0,
            },
          }
        : demoMode
          ? {
              displayName: "あなた",
              avatarUrl: null,
              bio: "まちの魅力を、未来のしるしに。",
              region: null,
              handle: null,
              isPro: false,
              counts: {
                posts: sourceItems.filter((p) => p.status !== "draft").length,
                followers: 0,
                following: 0,
              },
            }
          : null;

  const heading =
    isForeign && host ? `${host.displayName}のアルバム` : "マイアルバム";

  const handleTab = useCallback((next: AlbumHubTab) => {
    setTab(next);
    setAlbumDetailOpen(false);
  }, []);

  const emptyMessage = isForeign
    ? "公開中の記録はまだありません"
    : status === "draft"
      ? "保存した下書きはありません"
      : "まだ投稿がありません";

  const gridOrEmpty = (posts: MyPostItem[]) => {
    if (posts.length === 0) {
      return (
        <div className="mg-album-empty">
          <p>{emptyMessage}</p>
          {isForeign || status === "draft" ? null : (
            <Link href="/posts/new" className="mg-album-empty__cta">
              <Plus className="h-4 w-4" aria-hidden />
              投稿を作成
            </Link>
          )}
        </div>
      );
    }
    return (
      <MyAlbumMediaGrid
        posts={posts}
        onMutated={isForeign ? undefined : handleMutated}
        showMenu={false}
      />
    );
  };

  const main = () => {
    if (tab === "album") {
      return (
        <MySharedAlbumsPane
          isOwn={!isForeign}
          demoMode={demoMode}
          posts={sourceItems.filter((p) => p.status !== "draft")}
          profile={profile}
          peerId={authorId}
          initialAlbumId={searchParams.get("album")}
          joinToken={searchParams.get("join")}
          onDetailOpenChange={setAlbumDetailOpen}
        />
      );
    }
    if (tab === "map") {
      return <MyAlbumMapPane posts={visiblePosts} />;
    }
    return gridOrEmpty(visiblePosts);
  };

  if (!isForeign && settled && !user && !demoMode) {
    return (
      <div className="mg-album-hub my-album-page min-h-screen">
        <div className="my-album-shell">
          <MyAlbumProfileHeader
            profile={null}
            heading="マイアルバム"
            lead="思い出は、まちの宝もの。"
            isOwn
          />
          <div className="mg-album-empty mg-album-empty--auth">
            <p>ログインすると、自分のアルバムを残せます。</p>
            <Link href="/auth?next=/profile/posts" className="mg-album-empty__cta">
              ログインはこちら
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hideChrome = albumDetailOpen && tab === "album";
  const showPostTools = tab === "posts" && !hideChrome;

  return (
    <div className={cn("mg-album-hub my-album-page min-h-screen")}>
      <div className="my-album-shell">
        {hideChrome ? null : loading || authLoading ? (
          <MyAlbumProfileSkeleton />
        ) : (
          <MyAlbumProfileHeader
            profile={profile}
            heading={heading}
            lead="思い出は、まちの宝もの。"
            isOwn={!isForeign}
            authorId={authorId}
            onSelectPosts={() => handleTab("posts")}
          />
        )}

        {showPostTools ? (
          <>
            <MyAlbumSeasonBar value={season} onChange={setSeason} />
            <MyAlbumFilterBar
              category={category}
              onCategory={setCategory}
              sort={sort}
              onSort={setSort}
              year={selectedYear}
              years={years}
              onYear={setSelectedYear}
              status={status}
              onStatus={setStatus}
              hideDrafts={isForeign}
            />
          </>
        ) : null}

        {hideChrome ? null : <MyAlbumViewTabs value={tab} onChange={handleTab} />}

        <div className="mg-album-main">
          {loading || authLoading ? (
            <div className="mg-album-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mg-album-tile is-skeleton">
                  <div className="mg-album-tile__photo" />
                  <div className="mg-album-tile__meta">
                    <div className="mg-album-skel mg-album-skel--date" />
                    <div className="mg-album-skel mg-album-skel--title" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            main()
          )}
        </div>
      </div>
    </div>
  );
}
