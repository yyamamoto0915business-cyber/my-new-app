"use client";

import { useState } from "react";
import Image from "next/image";

const OPTIMIZED_HOSTS = [
  "images.unsplash.com",
  "placehold.co",
  "i.imgur.com",
  "supabase.co",
];

function canUseNextImage(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return OPTIMIZED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

type Props = {
  src: string;
  alt?: string;
  className?: string;
  /** fill モード（親が relative） */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  /** 読み込み失敗・無効URL時の代替 */
  fallback: React.ReactNode;
};

/** 主催者プロフィール用。許可外ホストは img、失敗時は fallback。 */
export function OrganizerRemoteImage({
  src,
  alt = "",
  className,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  fallback,
}: Props) {
  const [failed, setFailed] = useState(false);
  const url = src.trim();

  if (!url || failed) {
    return <>{fallback}</>;
  }

  if (canUseNextImage(url)) {
    return (
      <Image
        src={url}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={url.includes("supabase.co")}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={
        fill
          ? `absolute inset-0 h-full w-full object-cover ${className ?? ""}`.trim()
          : className
      }
      style={
        !fill && width && height
          ? { width, height, objectFit: "cover" }
          : undefined
      }
      onError={() => setFailed(true)}
    />
  );
}
