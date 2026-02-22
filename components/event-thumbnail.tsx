"use client";

import Image from "next/image";
import { EventImagePlaceholder } from "./event-image-placeholder";

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

type Props = {
  imageUrl: string | null;
  alt: string;
  className?: string;
  rounded?: "none" | "lg" | "xl";
  priority?: boolean;
};

/** 16:9 サムネイル。imageUrl が空ならプレースホルダーを表示。CLS 防止のため固定アスペクト比。 */
export function EventThumbnail({
  imageUrl,
  alt,
  className = "",
  rounded = "lg",
  priority = false,
}: Props) {
  const hasImage = imageUrl?.trim();

  if (!hasImage) {
    return (
      <div
        className={`overflow-hidden ${rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : ""} ${className}`}
      >
        <EventImagePlaceholder />
      </div>
    );
  }

  const useNextImage = isAllowedHost(imageUrl);
  const roundedClass =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "";

  return (
    <div
      className={`relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${roundedClass} ${className}`}
    >
      {useNextImage ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized={false}
          priority={priority}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        /* 未許可ホストは img で表示（next/image は remotePatterns 制限あり） */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
