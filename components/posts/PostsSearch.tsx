"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CommonAvatar } from "@/components/profile/common-avatar";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import type { UserSearchHit } from "@/lib/db/user-search";
import styles from "./PostsExplore.module.css";

type Props = {
  /** 外から入れる検索語（タグをタップしたときなど） */
  value?: string;
  /** 投稿の絞り込みに使う文字列（変換確定後のみ反映） */
  onQueryChange: (query: string) => void;
};

/** 場所・キーワード・#タグで投稿を探す。一致するユーザーは候補として下に出す */
export function PostsSearch({ value, onQueryChange }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!composing) onQueryChange(query);
  }, [query, composing, onQueryChange]);

  const [users, setUsers] = useState<UserSearchHit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (composing) return;
    if (!trimmed) {
      setUsers([]);
      return;
    }
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

  // ユーザーが見つかったときだけ候補を出す（投稿はグリッド側で絞り込まれる）
  const showPanel = open && query.trim().length > 0 && users.length > 0;

  return (
    <div className="posts-user-search" ref={rootRef}>
      <label className="posts-user-search__field">
        <Search className="posts-user-search__icon" aria-hidden />
        <input
          type="search"
          value={query}
          placeholder="場所・キーワード・#タグで探す"
          aria-label="投稿を検索"
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
          <p className={styles.searchSection}>ユーザー</p>
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
        </div>
      ) : null}
    </div>
  );
}
