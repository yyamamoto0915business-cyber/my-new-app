"use client";

import { useCallback } from "react";

type Props = {
  eventId: string;
  isActive: boolean;
  onToggle: (eventId: string) => void;
  className?: string;
};

/** ブックマークトグル（小さめアイコン・主張しすぎない） */
export function BookmarkToggle({ eventId, isActive, onToggle, className = "" }: Props) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle(eventId);
    },
    [eventId, onToggle]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isActive ? "保存を解除" : "保存する"}
      className={`rounded-full p-1.5 transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ${className}`}
    >
      {isActive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 text-[var(--accent)]"
        >
          <path
            fillRule="evenodd"
            d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 text-white/90"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  );
}
