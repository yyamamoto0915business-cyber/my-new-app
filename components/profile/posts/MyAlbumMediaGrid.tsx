"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { formatMyPostDotDate } from "@/lib/posts/visited-range";
import type { PostMutation } from "./PostCardMenu";
import { PostCardMenu } from "./PostCardMenu";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";

export function MyAlbumMediaGrid({
  posts,
  onMutated,
  showMenu = true,
  addedBy,
}: {
  posts: MyPostItem[];
  onMutated?: (id: string, change: PostMutation) => void;
  showMenu?: boolean;
  addedBy?: Record<string, { displayName: string; avatarUrl: string | null }>;
}) {
  return (
    <div className="mg-album-grid">
      {posts.map((post) => {
        const isDraft = post.status === "draft";
        const href = `/posts/${post.id}`;
        const photo = (
          <div className="mg-album-tile__photo">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 720px) 33vw, 220px"
              />
            ) : (
              <span className="mg-album-tile__empty">
                <ImageIcon className="h-5 w-5" aria-hidden />
              </span>
            )}
            {post.mediaType === "video" ? (
              <span className="mg-album-tile__play">
                <Play className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
            {isDraft ? <span className="mg-album-tile__flag">下書き</span> : null}
            {post.status === "hidden" ? (
              <span className="mg-album-tile__flag mg-album-tile__flag--hidden">
                非公開
              </span>
            ) : null}
            {addedBy?.[post.id] ? (
              <span className="mg-album-tile__who" title={addedBy[post.id].displayName}>
                <ProfileBannerAvatar
                  avatarUrl={addedBy[post.id].avatarUrl}
                  displayName={addedBy[post.id].displayName}
                />
              </span>
            ) : null}
          </div>
        );

        return (
          <article key={post.id} className="mg-album-tile" data-status={post.status}>
            {isDraft ? (
              photo
            ) : (
              <Link href={href} className="mg-album-tile__hit" aria-label={post.title}>
                {photo}
              </Link>
            )}
            <div className="mg-album-tile__meta">
              <p className="mg-album-tile__date">{formatMyPostDotDate(post)}</p>
              <p className="mg-album-tile__title">{post.title}</p>
            </div>
            {showMenu ? (
              <div className="mg-album-tile__menu">
                <PostCardMenu post={post} onMutated={onMutated} popDirection="down" />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
