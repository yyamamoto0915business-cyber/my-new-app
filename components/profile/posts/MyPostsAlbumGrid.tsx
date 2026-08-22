"use client";

import Image from "next/image";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { groupMyPostsByMonth } from "@/lib/posts/group-my-posts-by-month";
import { MyAlbumCard } from "./MyAlbumCard";
import type { PostMutation } from "./PostCardMenu";

const MONTH_EN = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

const MONTH_DECOR = [
  "/profile/album/sakura-cut.png",
  "/profile/album/leaf-cluster.png",
  "/profile/album/lavender-cut.png",
  "/profile/album/maple-cut.png",
] as const;

export function MyPostsAlbumGrid({
  posts,
  monthRefs,
  onMutated,
  showMenu = true,
}: {
  posts: MyPostItem[];
  monthRefs?: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onMutated?: (id: string, change: PostMutation) => void;
  showMenu?: boolean;
}) {
  const groups = groupMyPostsByMonth(posts);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group, gi) => {
        const [year, month] = group.key.split("-");
        const decor = MONTH_DECOR[gi % MONTH_DECOR.length];
        return (
          <section
            key={group.key}
            className="my-album-month"
            ref={(el) => {
              if (monthRefs) monthRefs.current[group.key] = el;
            }}
          >
            <Image
              src={decor}
              alt=""
              width={120}
              height={150}
              className={`my-album-month__decor my-album-month__decor--${gi % 2 === 0 ? "a" : "b"}`}
              aria-hidden
            />
            <header className="my-album-month__head">
              <div className="my-album-month__heading">
                <p className="my-album-month__eyebrow">
                  {MONTH_EN[Number(month) - 1]} {year}
                </p>
                <h2 className="my-album-month__label">
                  <span className="my-album-month__num" aria-hidden>
                    {Number(month)}
                  </span>
                  {group.label}
                </h2>
              </div>
              <span className="my-album-month__count">
                {group.posts.length}件の思い出
              </span>
            </header>
            <div className="my-album-grid">
              {group.posts.map((post, i) => (
                <MyAlbumCard
                  key={post.id}
                  post={post}
                  index={i}
                  onMutated={onMutated}
                  showMenu={showMenu}
                />
              ))}
            </div>
          </section>
        );
      })}
      <p className="my-album-footnote">思い出を、つなげていこう。</p>
    </div>
  );
}
