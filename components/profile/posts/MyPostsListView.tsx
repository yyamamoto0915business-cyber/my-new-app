"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ImageIcon, MessageCircle, Play } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { formatPostDate } from "@/lib/posts/group-my-posts-by-month";
import { PostCardMenu, type PostMutation } from "./PostCardMenu";

export function MyPostsListView({
  posts,
  onMutated,
}: {
  posts: MyPostItem[];
  onMutated?: (id: string, change: PostMutation) => void;
}) {
  return (
    <ul className="my-list">
      {posts.map((post) => (
        <li key={post.id}>
          <MyPostRow post={post} onMutated={onMutated} />
        </li>
      ))}
    </ul>
  );
}

function MyPostRow({
  post,
  onMutated,
}: {
  post: MyPostItem;
  onMutated?: (id: string, change: PostMutation) => void;
}) {
  const isDraft = post.status === "draft";

  const inner = (
    <div className="my-list-row">
      <div className="my-list-row__thumb">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="84px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#C5C2BA]">
            <ImageIcon className="h-5 w-5" aria-hidden />
          </div>
        )}
        {post.mediaType === "video" && (
          <span className="my-list-row__play">
            <Play className="h-3 w-3" aria-hidden />
          </span>
        )}
      </div>
      <div className="my-list-row__body">
        <div className="flex items-center gap-2">
          <span className="my-list-row__badge">{post.categoryLabel}</span>
          {isDraft && <span className="my-list-row__draft">下書き</span>}
        </div>
        <p className="my-list-row__title">{post.title}</p>
        <p className="my-list-row__date">{formatPostDate(post.createdAt)}</p>
      </div>
      <div className="my-list-row__stats">
        <span className="inline-flex items-center gap-0.5">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {post.viewCount}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          {post.likeCount}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          {post.commentCount}
        </span>
      </div>
    </div>
  );

  return (
    <div className="my-list-row-wrap">
      {isDraft ? (
        inner
      ) : (
        <Link href={`/posts/${post.id}`} className="block">
          {inner}
        </Link>
      )}
      <div className="my-list-row-menu">
        <PostCardMenu post={post} onMutated={onMutated} />
      </div>
    </div>
  );
}
