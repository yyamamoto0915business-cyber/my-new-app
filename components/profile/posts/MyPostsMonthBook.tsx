"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
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

type Props = {
  monthKey: string;
  posts: MyPostItem[];
  onBack: () => void;
  header?: React.ReactNode;
  onMutated?: (id: string, change: PostMutation) => void;
};

export function MyPostsMonthBook({
  monthKey,
  posts,
  onBack,
  header,
  onMutated,
}: Props) {
  const [yearStr, monthStr] = monthKey.split("-");
  const monthNum = Number(monthStr);
  const decor = MONTH_DECOR[(monthNum - 1) % MONTH_DECOR.length];

  // 見開きの左右ページに振り分ける（右ページは中身があるときだけ描画）
  const half = Math.ceil(posts.length / 2);
  const pages = posts.length > 3 ? [posts.slice(0, half), posts.slice(half)] : [posts];

  // 件数に応じてカードの密度を切り替える
  const density =
    posts.length <= 2 ? "sparse" : posts.length <= 8 ? "normal" : "dense";

  return (
    <div className="my-album-book" data-density={density}>
      <div className="my-album-book__paper">
        <div className="my-album-book__rings" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Image
              key={i}
              src="/profile/album/album-ring.png"
              alt=""
              width={578}
              height={153}
              className="my-album-book__ring"
            />
          ))}
        </div>

        {header ? (
          <div className="my-album-book__toolbar">{header}</div>
        ) : null}

        <div className="my-album-monthpage__bar">
          <button type="button" className="my-album-back" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            アルバムに戻る
          </button>
        </div>

        <div className="my-album-book__spread">
          {pages.map((pagePosts, pageIndex) =>
            pagePosts.length === 0 ? null : (
              <section key={pageIndex} className="my-album-monthpage">
                {pageIndex === 0 && (
                  <header className="my-album-monthpage__head">
                    <p className="my-album-monthpage__eyebrow">
                      {MONTH_EN[monthNum - 1]} {yearStr}
                    </p>
                    <h2 className="my-album-monthpage__label">
                      <span className="my-album-monthpage__num" aria-hidden>
                        {monthNum}
                      </span>
                      月の思い出
                    </h2>
                    <Image
                      src={decor}
                      alt=""
                      width={80}
                      height={80}
                      className="my-album-monthpage__decor"
                      aria-hidden
                    />
                  </header>
                )}
                <div className="my-album-monthpage__grid">
                  {pagePosts.map((post, i) => (
                    <MyAlbumCard
                      key={post.id}
                      post={post}
                      index={i}
                      onMutated={onMutated}
                    />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>

        <Image
          src="/profile/album/maple-cut.png"
          alt=""
          width={90}
          height={90}
          className="my-album-book__accent"
          aria-hidden
        />
      </div>
    </div>
  );
}
