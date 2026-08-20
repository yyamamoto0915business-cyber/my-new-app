"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  PostCardMenu,
  type PostMutation,
} from "@/components/profile/posts/PostCardMenu";

type Props = {
  post: MyPostItem;
  /** 行クリック時（ポップオーバーを閉じる等） */
  onSelect?: () => void;
  /** ケバブメニューを表示するか */
  showMenu?: boolean;
  onMutated?: (id: string, change: PostMutation) => void;
};

/** 作成画面の下書き行（サイドバーのパネルとヘッダーのポップオーバーで共有） */
export function PostCreateDraftRow({
  post,
  onSelect,
  showMenu = false,
  onMutated,
}: Props) {
  return (
    <li className="posts-create-drafts__item">
      <Link
        href={`/posts/new?draft=${post.id}`}
        className="posts-create-drafts__link"
        onClick={onSelect}
      >
        <span className="posts-create-drafts__thumb">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="72px"
            />
          ) : (
            <span className="posts-create-drafts__thumb-fallback">
              <ImageIcon className="h-4 w-4" aria-hidden />
            </span>
          )}
          {post.mediaType === "video" && (
            <span className="posts-create-drafts__play">
              <Play className="h-2.5 w-2.5" aria-hidden />
            </span>
          )}
        </span>
        <span className="posts-create-drafts__body">
          <span className="posts-create-drafts__title">
            {post.title || "タイトル未入力"}
          </span>
          <span className="posts-create-drafts__meta">{post.categoryLabel}</span>
          <span className="posts-create-drafts__date">{post.dateLabel}</span>
        </span>
      </Link>
      {showMenu && (
        <div className="posts-create-drafts__menu">
          <PostCardMenu post={post} onMutated={onMutated} />
        </div>
      )}
    </li>
  );
}
