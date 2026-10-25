"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import {
  markStorySeen,
  readSeenStories,
  type FollowingStory,
} from "@/lib/posts/following-stories";
import styles from "./PostsExplore.module.css";

const CTA_SHARE_ILLUST = "/posts/cta-share-illust.png";

/**
 * フォロー中の人の最近の投稿を丸アイコンで並べる（ストーリーズ風）
 * まだ見ていない人はリングに色が付き、先頭に来る
 */
export function PostsFollowingStories({
  onOpen,
}: {
  onOpen: (story: FollowingStory) => void;
}) {
  const [stories, setStories] = useState<FollowingStory[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setSeen(readSeenStories());
    fetch("/api/posts/following")
      .then((res) => (res.ok ? res.json() : { stories: [] }))
      .then((data: { stories?: FollowingStory[] }) => {
        if (!cancelled) setStories(data.stories ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = useMemo(() => {
    const isSeen = (s: FollowingStory) => seen[s.authorId] === s.latestPostId;
    return [...stories].sort((a, b) => Number(isSeen(a)) - Number(isSeen(b)));
  }, [stories, seen]);

  if (ordered.length === 0) return null;

  return (
    <section aria-label="フォロー中の人の新しい投稿">
      <h2 className={styles.storiesTitle}>フォロー中の新着</h2>
      <div className={styles.stories}>
        {ordered.map((story) => {
          const unseen = seen[story.authorId] !== story.latestPostId;
          return (
            <button
              key={story.authorId}
              type="button"
              className={styles.story}
              aria-label={`${story.authorName}さんの新しい投稿${unseen ? "（未読）" : ""}を見る`}
              onClick={() => {
                setSeen(markStorySeen(story));
                onOpen(story);
              }}
            >
              <span className={cn(styles.storyRing, !unseen && styles.storyRingSeen)}>
                <span className={styles.storyImg}>
                  <AuthorAvatar name={story.authorName} src={story.authorAvatarUrl} />
                </span>
                {story.posts.length > 1 ? (
                  <span className={styles.storyCount}>{story.posts.length}</span>
                ) : null}
              </span>
              <span className={cn(styles.storyLabel, !unseen && styles.storyLabelSeen)}>
                {story.authorName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** グリッドの下：人気タグと投稿のおさそい */
export function PostsDiscoverFooter({
  tags,
  onTagSelect,
}: {
  tags: string[];
  onTagSelect: (tag: string) => void;
}) {
  return (
    <div className={styles.discoverFooter}>
      {tags.length > 0 ? (
        <section aria-label="人気のタグ">
          <h2 className={styles.footerTitle}>人気のタグ</h2>
          <div className={styles.tagList}>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.tag}
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.invite}>
        <div className={styles.inviteBody}>
          <p className={styles.inviteEyebrow}>あなたの「好き」が、まちの魅力に</p>
          <h2 className={styles.inviteTitle}>見つけた景色を、みんなに</h2>
          <p className={styles.inviteDesc}>写真1枚、ひとことでも大丈夫です。</p>
          <Link href="/posts/new" className={styles.inviteCta}>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            投稿してみる
          </Link>
        </div>
        <div className={styles.inviteIllust} aria-hidden>
          <Image src={CTA_SHARE_ILLUST} alt="" fill sizes="110px" className="object-contain" />
        </div>
      </section>
    </div>
  );
}
