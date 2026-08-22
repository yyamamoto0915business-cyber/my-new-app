"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { cn } from "@/lib/utils";
import { CommonAvatar } from "@/components/profile/common-avatar";
import {
  PREVIEW_FOLLOWERS,
  PREVIEW_FOLLOWING,
} from "@/lib/follows/preview-people";

type Item = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  albumHref: string;
};

type FollowsPayload = {
  items?: Item[];
  followerCount?: number;
  followingCount?: number;
};

function GrayChip({
  children,
  onClick,
  disabled,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-8 shrink-0 rounded-lg bg-[#efefef] px-4 text-[13px] font-semibold text-[#1a1a1a] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function FollowsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "following" ? "following" : "followers";
  const { user, loading: authLoading } = useSupabaseUser();
  const [items, setItems] = useState<Item[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const previewItems = tab === "following" ? PREVIEW_FOLLOWING : PREVIEW_FOLLOWERS;
    if (!user) {
      setItems(previewItems);
      setFollowerCount(PREVIEW_FOLLOWERS.length);
      setFollowingCount(PREVIEW_FOLLOWING.length);
      setLoading(false);
      return;
    }
    setLoading(true);
    setQuery("");
    fetch(`/api/me/follows?tab=${tab}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: FollowsPayload) => {
        const next = data.items ?? [];
        if (next.length === 0) {
          setItems(previewItems);
          setFollowerCount(PREVIEW_FOLLOWERS.length);
          setFollowingCount(PREVIEW_FOLLOWING.length);
          return;
        }
        setItems(next);
        setFollowerCount(data.followerCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.displayName.toLowerCase().includes(q));
  }, [items, query]);

  async function removeFollower(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await fetch(`/api/me/follows?followerId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setFollowerCount((n) => Math.max(0, n - 1));
    } finally {
      setBusyId(null);
    }
  }

  async function unfollowUser(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await fetch(`/api/follows?userId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setFollowingCount((n) => Math.max(0, n - 1));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      data-follows-page=""
      className="mg-profile-mobile-page mg-mypage-mobile-white relative z-[1] min-h-svh w-full bg-white"
    >
      <div className="mx-auto w-full max-w-lg flex-1">
      <nav className="grid grid-cols-[40px_1fr_1fr] items-end border-b border-[#dbdbdb]">
        <Link
          href="/profile"
          className="mb-px flex h-11 w-10 items-center justify-center text-[#1a1a1a]"
          aria-label="マイページに戻る"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        </Link>
        <Link
          href="/profile/follows?tab=followers"
          className={cn(
            "-mb-px py-2.5 text-center text-[14px] font-semibold",
            tab === "followers"
              ? "border-b-[2px] border-[#1a1a1a] text-[#1a1a1a]"
              : "text-[#8e8e8e]",
          )}
        >
          {followerCount} フォロワー
        </Link>
        <Link
          href="/profile/follows?tab=following"
          className={cn(
            "-mb-px py-2.5 text-center text-[14px] font-semibold",
            tab === "following"
              ? "border-b-[2px] border-[#1a1a1a] text-[#1a1a1a]"
              : "text-[#8e8e8e]",
          )}
        >
          {followingCount} フォロー中
        </Link>
      </nav>

      <div className="px-4 py-2">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-[#efefef] px-3">
          <Search className="h-4 w-4 shrink-0 text-[#8e8e8e]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索"
            className="h-full w-full bg-transparent text-[15px] text-[#1a1a1a] outline-none placeholder:text-[#8e8e8e]"
          />
        </label>
      </div>

      {loading || authLoading ? (
        <p className="mt-8 text-center text-sm text-[#8e8e8e]">読み込み中…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[#8e8e8e]">
          {tab === "followers"
            ? "まだフォロワーはいません。"
            : "まだフォロー中の人はいません。"}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[#8e8e8e]">一致する人がいません。</p>
      ) : (
        <ul>
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center pr-4">
              <Link
                href={item.albumHref}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 py-2.5"
              >
                <CommonAvatar
                  avatarUrl={item.avatarUrl}
                  displayName={item.displayName}
                  size="md"
                  className="!h-11 !w-11"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold leading-tight text-[#1a1a1a]">
                    {item.displayName}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] leading-tight text-[#8e8e8e]">
                    アルバムを見る
                  </span>
                </span>
              </Link>
              {tab === "followers" ? (
                <GrayChip
                  disabled={busyId === item.id}
                  onClick={() => void removeFollower(item.id)}
                >
                  削除
                </GrayChip>
              ) : (
                <GrayChip
                  disabled={busyId === item.id}
                  onClick={() => void unfollowUser(item.id)}
                >
                  フォロー中
                </GrayChip>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}
