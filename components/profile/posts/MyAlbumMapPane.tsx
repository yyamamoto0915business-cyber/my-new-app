"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { collectAlbumAreas } from "@/lib/posts/my-album-view";

export function MyAlbumMapPane({ posts }: { posts: MyPostItem[] }) {
  const areas = collectAlbumAreas(posts);

  if (areas.length === 0) {
    return (
      <div className="mg-album-empty">
        <MapPin className="mx-auto mb-2 h-5 w-5" aria-hidden />
        場所がついた記録は、まだありません
      </div>
    );
  }

  return (
    <ul className="mg-album-places">
      {areas.map((item) => (
        <li key={item.area}>
          <Link href={`/posts/${item.preview.id}`} className="mg-album-place">
            <span className="mg-album-place__photo">
              {item.preview.imageUrl ? (
                <Image
                  src={item.preview.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : null}
            </span>
            <span className="mg-album-place__body">
              <span className="mg-album-place__name">{item.area}</span>
              <span className="mg-album-place__count">{item.count}件の思い出</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
