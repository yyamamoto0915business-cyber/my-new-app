"use client";

import { EVENT_TAGS } from "@/lib/db/types";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
};

export function TagFilter({ selectedTags, onTagsChange, className = "" }: Props) {
  const handleToggle = useCallback(
    (tagId: string) => {
      if (selectedTags.includes(tagId)) {
        onTagsChange(selectedTags.filter((t) => t !== tagId));
      } else {
        onTagsChange([...selectedTags, tagId]);
      }
    },
    [selectedTags, onTagsChange]
  );

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {EVENT_TAGS.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => handleToggle(tag.id)}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedTags.includes(tag.id)
              ? "bg-[var(--accent)] text-white"
              : "border border-zinc-200/60 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {tag.label}
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={() => onTagsChange([])}
          className="rounded-xl border border-zinc-200/60 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          タグをクリア
        </button>
      )}
    </div>
  );
}
