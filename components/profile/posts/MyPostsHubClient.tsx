"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera } from "lucide-react";
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
  const [category, setCategory] = useState<AlbumCategoryFilter>("all");
  const [sort, setSort] = useState<AlbumSortKey>("new");
  const [status, setStatus] = useState<AlbumStatusFilter>(() =>
    !isForeign && searchParams.get("view") === "drafts" ? "draft" : "all",
  );
  const [albumDetailOpen, setAlbumDetailOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
            locked?: boolean;
            blocked?: boolean;
            blockedByMe?: boolean;
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
          setLocked(Boolean(payload.locked));
          setBlocked(Boolean(payload.blocked));
          setBlockedByMe(Boolean(payload.blockedByMe));
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
            setLocked(false);
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
  }, [user, authLoading, authorId, router, reloadKey]);

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
        season: "all",
        category,
        year: selectedYear,
        status,
        sort,
        includeDrafts: false,
      }),
    [sourceItems, category, selectedYear, status, sort],
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
              displayName: "やま",
              avatarUrl: "https://picsum.photos/seed/mg-yama/96/96",
              bio: "まちの魅力を、未来のしるしに。",
              region: null,
              handle: "machi_glyph",
              isPro: false,
              counts: {
                posts: sourceItems.filter((p) => p.status !== "draft").length,
                followers: 24,
                following: 18,
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
              <Camera className="h-4 w-4" aria-hidden />
              写真を追加する
            </Link>
          )}
        </div>
      );
    }
    return (
      <MyAlbumMediaGrid
        posts={posts}
        onMutated={isForeign ? undefined : handleMutated}
        showMenu={!isForeign}
        addHref={isForeign || status === "draft" ? undefined : "/posts/new"}
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
            eyebrow="マイアルバム"
            headline="まちの思い出をアルバムに"
            lead="あなたの好きな景色や出来事を、未来のしるしに残そう。"
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
  const showSkeleton = !demoMode && (loading || authLoading);

  return (
    <div className={cn("mg-album-hub my-album-page min-h-screen")}>
      <div className="my-album-shell">
        {hideChrome ? null : showSkeleton ? (
          <MyAlbumProfileSkeleton />
        ) : (
          <MyAlbumProfileHeader
            profile={profile}
            eyebrow={heading}
            headline="まちの思い出をアルバムに"
            lead="あなたの好きな景色や出来事を、未来のしるしに残そう。"
            isOwn={!isForeign}
            authorId={authorId}
            shareUserId={isForeign ? authorId : user?.id}
            onSelectPosts={() => handleTab("posts")}
            onFollowChange={(status) => {
              if (status === "accepted" || status === "none") {
                setReloadKey((n) => n + 1);
              }
            }}
            blockedByMe={blockedByMe}
            onBlockChange={() => setReloadKey((n) => n + 1)}
          />
        )}

        {isForeign && locked && !showSkeleton ? (
          <div className="mg-album-empty mg-album-locked">
            {blocked ? (
              <>
                <p className="mg-album-locked__title">
                  {blockedByMe ? "このユーザーをブロックしています" : "このアルバムは表示できません"}
                </p>
                {blockedByMe ? (
                  <p>名前の横の「…」からブロックを解除できます。</p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mg-album-locked__title">このアカウントは非公開です</p>
                <p>フォローが承認されると、アルバムを見られます。</p>
              </>
            )}
          </div>
        ) : null}

        <div className="mg-album-controls">
          {showPostTools && (!isForeign || (!locked && !showSkeleton)) ? (
            <div className="mg-album-toolbar">
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
            </div>
          ) : null}

          {hideChrome || (isForeign && (locked || showSkeleton)) ? null : (
            <MyAlbumViewTabs value={tab} onChange={handleTab} />
          )}

        </div>

        <div className="mg-album-main">
          {showSkeleton ? (
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
          ) : isForeign && locked ? null : (
            main()
          )}
        </div>
      </div>
    </div>
  );
}
