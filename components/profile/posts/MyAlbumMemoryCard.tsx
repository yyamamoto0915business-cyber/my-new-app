"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ImageIcon, MessageCircle, Play } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { seasonOfPost } from "@/lib/posts/group-my-posts-by-season";
import { excerptForMyPost } from "@/lib/posts/my-posts-demo";
import { PostCardMenu, type PostMutation } from "./PostCardMenu";

const SEASON_ICON = {
  spring: "/profile/album/sakura-cut.png",
  summer: "/profile/album/leaf-cluster.png",
  autumn: "/profile/album/maple-cut.png",
  winter: "/profile/album/winter-cut.png",
} as const;

function formatDotDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(iso))
    .replaceAll("-", ".");
}

function clampExcerpt(text: string, max = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function MyAlbumMemoryCard({
  post,
  active,
  interactive,
  onMutated,
}: {
  post: MyPostItem;
  active?: boolean;
  interactive?: boolean;
  onMutated?: (id: string, change: PostMutation) => void;
}) {
  const isDraft = post.status === "draft";
  const isHidden = post.status === "hidden";
  const linkable = !isDraft && !isHidden;
  const href = `/posts/${post.id}`;
  const excerpt = clampExcerpt(excerptForMyPost(post));
  const season = seasonOfPost(post.createdAt);
  const showMenu = Boolean(active && interactive);

  const photo = (
    <div className="my-album-memory__photo">
      {post.imageUrl ? (
        <Image
          src={post.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 40vw, 300px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#C5C2BA]">
          <ImageIcon className="h-6 w-6" aria-hidden />
        </div>
      )}
      {post.mediaType === "video" && (
        <span className="my-album-memory__play">
          <Play className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </div>
  );

  const title = <p className="my-album-memory__title">{post.title}</p>;

  const dateRow = (
    <div className="my-album-memory__head">
      <span className="my-album-memory__date">
        <Image
          src={SEASON_ICON[season]}
          alt=""
          width={16}
          height={16}
          className="my-album-memory__season-icon"
          aria-hidden
        />
        {formatDotDate(post.createdAt)}
      </span>
      {showMenu ? <span className="my-album-memory__menu-spacer" aria-hidden /> : null}
    </div>
  );

  const content = (
    <>
      {dateRow}
      {photo}
      <div className="my-album-memory__body">
        {title}
        {excerpt ? (
          <p className="my-album-memory__excerpt">{excerpt}</p>
        ) : null}
      </div>
      <div className="my-album-memory__foot">
        <span className="my-album-memory__stat">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          {post.likeCount}
        </span>
        <span className="my-album-memory__stat">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          {post.commentCount}
        </span>
      </div>
    </>
  );

  return (
    <article
      className="my-album-memory"
      data-active={active ? "true" : "false"}
      data-status={post.status}
    >
      {linkable ? (
        <Link
          href={href}
          className="my-album-memory__hit"
          aria-label={post.title}
          tabIndex={active ? 0 : -1}
          draggable={false}
        >
          {content}
        </Link>
      ) : (
        content
      )}
      {showMenu ? (
        <div className="my-album-memory__menu" data-no-swipe>
          <PostCardMenu
            post={post}
            onMutated={onMutated}
            popDirection="down"
          />
        </div>
      ) : null}
    </article>
  );
}
