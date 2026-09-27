"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import type { SharedAlbumItemView } from "@/lib/posts/shared-album-types";
import { cn } from "@/lib/utils";

function monthDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shapeFromSize(width: number, height: number): "tall" | "wide" {
  if (width <= 0 || height <= 0) return "tall";
  return width > height ? "wide" : "tall";
}

function SharedAlbumShot({
  item,
  index,
}: {
  item: SharedAlbumItemView;
  index: number;
}) {
  const [shape, setShape] = useState<"tall" | "wide">(item.shape ?? "tall");
  const caption = item.caption || item.post.title;

  return (
    <Link
      href={`/posts/${item.post.id}`}
      className={cn(
        "mg-share-shot",
        shape === "tall" ? "is-tall" : "is-wide",
        `is-n${(index % 8) + 1}`,
      )}
    >
      <span className="mg-share-shot__photo">
        {item.post.imageUrl ? (
          <Image
            src={item.post.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 720px) 50vw, 320px"
            onLoadingComplete={(img) =>
              setShape(shapeFromSize(img.naturalWidth, img.naturalHeight))
            }
          />
        ) : (
          <span className="mg-share-shot__blank" />
        )}
        <span className="mg-share-shot__caption">{caption}</span>
      </span>
      <span className="mg-share-shot__meta">
        <span className="mg-share-shot__who">
          <span className="mg-share-shot__av">
            <ProfileBannerAvatar
              avatarUrl={item.addedBy.avatarUrl}
              displayName={item.addedBy.displayName}
            />
          </span>
          <span>
            <strong>{item.addedBy.displayName}</strong>
            <small>{monthDay(item.post.createdAt)}</small>
          </span>
        </span>
        <span className="mg-share-shot__stats">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          {item.post.likeCount}
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          {item.post.commentCount}
        </span>
      </span>
    </Link>
  );
}

export function SharedAlbumShotGrid({
  items,
}: {
  items: SharedAlbumItemView[];
}) {
  return (
    <div className="mg-share-masonry">
      {items.map((item, index) => (
        <SharedAlbumShot key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

export function SharedAlbumTimeline({
  items,
}: {
  items: SharedAlbumItemView[];
}) {
  const ordered = [...items].sort(
    (a, b) =>
      new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime(),
  );
  return (
    <ul className="mg-share-timeline">
      {ordered.map((item) => (
        <li key={item.id}>
          <Link href={`/posts/${item.post.id}`} className="mg-share-timeline__row">
            <span className="mg-share-timeline__photo">
              {item.post.imageUrl ? (
                <Image
                  src={item.post.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : null}
            </span>
            <span>
              <strong>{item.caption || item.post.title}</strong>
              <small>
                {item.addedBy.displayName}　{monthDay(item.post.createdAt)}
              </small>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
