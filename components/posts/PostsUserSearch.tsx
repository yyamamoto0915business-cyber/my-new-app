"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CommonAvatar } from "@/components/profile/common-avatar";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import type { UserSearchHit } from "@/lib/db/user-search";

export function PostsUserSearch() {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (composing) return;
    if (!trimmed) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        .then(async (res) => {
          if (!res.ok) return { users: [] as UserSearchHit[] };
          return (await res.json()) as { users?: UserSearchHit[] };
        })
        .then((data) => {
          if (cancelled) return;
          setUsers(data.users ?? []);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setUsers([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, composing]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const showPanel = open && query.trim().length > 0;

  return (
    <div className="posts-user-search" ref={rootRef}>
      <label className="posts-user-search__field">
        <Search className="posts-user-search__icon" aria-hidden />
        <input
          type="search"
          value={query}
          placeholder="ユーザーを検索"
          aria-label="ユーザーを検索"
          aria-expanded={showPanel}
          aria-controls={listId}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(event) => {
            setComposing(false);
            setQuery(event.currentTarget.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        />
      </label>
      {showPanel ? (
        <div className="posts-user-search__panel" id={listId} role="listbox">
          {loading && users.length === 0 ? (
            <p className="posts-user-search__empty">検索しています…</p>
          ) : users.length === 0 ? (
            <p className="posts-user-search__empty">一致するユーザーはいません</p>
          ) : (
            <ul>
              {users.map((user) => (
                <li key={user.id} className="posts-user-search__row" role="option">
                  <Link
                    href={`/users/${user.id}/album`}
                    className="posts-user-search__person"
                    onClick={() => setOpen(false)}
                  >
                    <CommonAvatar
                      avatarUrl={user.avatarUrl}
                      displayName={user.displayName}
                      size="md"
                    />
                    <span className="posts-user-search__text">
                      <span className="posts-user-search__name">{user.displayName}</span>
                      <span className="posts-user-search__meta">
                        {user.region ? user.region : "地域未設定"}
                        {user.isPrivate ? " · 非公開" : ""}
                      </span>
                    </span>
                  </Link>
                  {user.followStatus === "self" ? (
                    <span className="posts-user-search__self">あなた</span>
                  ) : (
                    <AuthorFollowButton
                      authorId={user.id}
                      compact
                      initialStatus={
                        user.followStatus === "rejected" ? "none" : user.followStatus
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
