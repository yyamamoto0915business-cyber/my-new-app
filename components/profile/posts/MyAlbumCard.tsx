"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { POST_CATEGORY_COLORS } from "@/lib/posts/mock-feed";
import { PostCardMenu, type PostMutation } from "./PostCardMenu";

// アルバム内のカードだけ「2026/4/5」のスラッシュ区切り・ゼロ埋めなしで表示
function formatAlbumDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}

export function MyAlbumCard({
  post,
  onMutated,
}: {
  post: MyPostItem;
  index?: number;
  onMutated?: (id: string, change: PostMutation) => void;
}) {
  const isDraft = post.status === "draft";
  const isHidden = post.status === "hidden";
  const linkable = !isDraft && !isHidden;
  const href = `/posts/${post.id}`;
  const badgeColor = POST_CATEGORY_COLORS[post.category] ?? "#2f8f57";

  const photo = (
    <div className="my-album-card__photo">
      {post.imageUrl ? (
        <Image
          src={post.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 600px) 46vw, (max-width: 900px) 30vw, 220px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#C5C2BA]">
          <ImageIcon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <span
        className="my-album-card__badge"
        style={{ backgroundColor: badgeColor }}
      >
        {post.categoryLabel}
      </span>
      {post.mediaType === "video" && (
        <span className="my-album-card__play">
          <Play className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      {isDraft && <span className="my-album-card__draft">下書き</span>}
      {isHidden && (
        <span className="my-album-card__hidden">非公開</span>
      )}
    </div>
  );

  const title = <p className="my-album-card__title">{post.title}</p>;

  const linkedContent = (
    <>
      {photo}
      <div className="my-album-card__caption">
        {title}
        <div className="my-album-card__foot">
          <span className="my-album-card__date">
            {formatAlbumDate(post.createdAt)}
          </span>
          <span className="my-album-card__menu-spacer" aria-hidden />
        </div>
      </div>
    </>
  );

  return (
    <article className="my-album-card" data-status={post.status}>
      {linkable ? (
        <Link
          href={href}
          className="my-album-card__hit"
          aria-label={post.title}
          data-no-swipe
        >
          {linkedContent}
        </Link>
      ) : (
        <>
          {photo}
          <div className="my-album-card__caption">
            {title}
            <div className="my-album-card__foot">
              <span className="my-album-card__date">
                {formatAlbumDate(post.createdAt)}
              </span>
              <PostCardMenu post={post} onMutated={onMutated} />
            </div>
          </div>
        </>
      )}
      {linkable ? (
        <div className="my-album-card__menu" data-no-swipe>
          <PostCardMenu post={post} onMutated={onMutated} />
        </div>
      ) : null}
    </article>
  );
}
