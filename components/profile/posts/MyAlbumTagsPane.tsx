"use client";

import { Diamond } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { collectAlbumTags } from "@/lib/posts/my-album-view";
import { cn } from "@/lib/utils";

export function MyAlbumTagsPane({
  posts,
  selected,
  onSelect,
}: {
  posts: MyPostItem[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  const tags = collectAlbumTags(posts);

  if (tags.length === 0) {
    return (
      <div className="mg-album-empty">
        <Diamond className="mx-auto mb-2 h-5 w-5" aria-hidden />
        タグのついた記録は、まだありません
      </div>
    );
  }

  return (
    <div className="mg-album-tags">
      {tags.map((item) => {
        const on = selected === item.tag;
        return (
          <button
            key={item.tag}
            type="button"
            className={cn("mg-album-tags__chip", on && "is-active")}
            aria-pressed={on}
            onClick={() => onSelect(on ? null : item.tag)}
          >
            #{item.tag}
            <span>{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
