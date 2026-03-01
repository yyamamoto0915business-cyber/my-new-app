"use client";

import Image from "next/image";
import { VolunteerImagePlaceholder } from "./volunteer-image-placeholder";

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
  imageUrl: string | null | undefined;
  alt: string;
  roleType?: string;
  className?: string;
  rounded?: "none" | "lg" | "xl";
  priority?: boolean;
};

/** 16:9 サムネイル。画像がなければカテゴリ別プレースホルダー。 */
export function VolunteerThumbnail({
  imageUrl,
  alt,
  roleType,
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
        <VolunteerImagePlaceholder roleType={roleType} />
      </div>
    );
  }

  const url = imageUrl as string;
  const useNextImage = isAllowedHost(url);
  const roundedClass =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "";

  return (
    <div
      className={`relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${roundedClass} ${className}`}
    >
      {useNextImage ? (
        <Image
          src={url}
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
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
