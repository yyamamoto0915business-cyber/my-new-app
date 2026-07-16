"use client";

import { useState } from "react";
import Image from "next/image";

const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "placehold.co",
  "i.imgur.com",
];

function isAllowedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** 高さを伸ばすNGクラス（親から渡されたら無視） */
const NG_CLASSES = ["h-full", "flex-1", "min-h-screen", "h-screen", "min-h-0"];

function filterNgClasses(cls: string): string {
  return cls
    .split(/\s+/)
    .filter((c) => !NG_CLASSES.includes(c) && !/^h-\[/.test(c) && !/^min-h-/.test(c))
    .join(" ");
}

type Props = {
  imageUrl: string | null;
  alt: string;
  className?: string;
  rounded?: "none" | "lg" | "xl";
  priority?: boolean;
  /** true のとき親の aspect に合わせて fill（absolute inset-0） */
  fill?: boolean;
  /** プレースホルダー文言のサイズ（compact / icon はカルーセル向け） */
  placeholderSize?: "default" | "sm" | "icon";
};

/** 16:9 サムネイル。アスペクト比固定で高さ伸び防止。imageUrl が空/壊れならプレースホルダー。 */
export function EventThumbnail({
  imageUrl,
  alt,
  className = "",
  rounded = "lg",
  priority = false,
  fill = false,
  placeholderSize = "default",
}: Props) {
  const [hasError, setHasError] = useState(false);
  const filteredClass = filterNgClasses(className);
  const roundedClass =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "";

  const containerClass = fill
    ? `absolute inset-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${roundedClass} ${filteredClass}`.trim()
    : `relative w-full aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${roundedClass} ${filteredClass}`.trim();

  const placeholderText =
    placeholderSize === "sm" ? "text-[10px]" : "text-[11px]";
  const iconSize =
    placeholderSize === "icon" ? 14 : placeholderSize === "sm" ? 16 : 20;
  const isIconOnly = placeholderSize === "icon";

  const Placeholder = () => (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-1 ${
        isIconOnly
          ? "bg-gradient-to-br from-[#e8f4ec] via-[#eef6f2] to-[#f5f0e6] text-[#b8c8bc]"
          : `text-[#aaa] ${placeholderText}`
      }`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={isIconOnly ? "opacity-40" : "opacity-60"}
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      {!isIconOnly && <span>画像なし</span>}
    </div>
  );

  if (!imageUrl?.trim()) {
    return (
      <div className={containerClass}>
        <Placeholder />
      </div>
    );
  }

  const url = imageUrl.trim();
  const useNextImage = isAllowedHost(url);

  if (hasError) {
    return (
      <div className={containerClass}>
        <Placeholder />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {useNextImage ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          unoptimized={false}
          priority={priority}
          onError={() => setHasError(true)}
        />
      ) : (
        /* 未許可ホストは img で表示 */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
