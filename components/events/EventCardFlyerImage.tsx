"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  isEventImageHostAllowed,
  EVENT_FLYER_PORTRAIT_RATIO_THRESHOLD,
} from "@/lib/event-image-display";

type Props = {
  imageUrl: string | null;
  alt: string;
  className?: string;
};

/**
 * 一覧カード用：親は `relative aspect-*` などでサイズ確定。absolute inset-0 で敷く。
 * 縦長〜やや横長は contain、明らかな横長は cover（詳細ページの EventDetailFlyerImage と同じ閾値）。
 */
export function EventCardFlyerImage({ imageUrl, alt, className }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const isWide =
    ratio !== null && ratio >= EVENT_FLYER_PORTRAIT_RATIO_THRESHOLD;

  const setDims = (w: number, h: number) => {
    if (w > 0 && h > 0) setRatio(w / h);
  };

  if (!imageUrl?.trim() || failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/95 text-xs text-zinc-400 dark:from-zinc-700/40 dark:to-zinc-800/70 dark:text-zinc-400",
          className
        )}
      >
        画像なし
      </div>
    );
  }

  const url = imageUrl.trim();
  const useNextImage = isEventImageHostAllowed(url);

  return (
    <div
      className={cn(
        "absolute inset-0 z-0 overflow-hidden bg-slate-100/95 dark:bg-zinc-900/55",
        className
      )}
    >
      {isWide ? (
        <div className="relative h-full w-full">
          {useNextImage ? (
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover object-center"
              onLoadingComplete={(img) =>
                setDims(img.naturalWidth, img.naturalHeight)
              }
              onError={() => setFailed(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              onLoad={(e) =>
                setDims(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
              }
              onError={() => setFailed(true)}
            />
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center p-1.5 sm:p-2">
          {useNextImage ? (
            <Image
              src={url}
              alt={alt}
              width={800}
              height={1200}
              className="max-h-full max-w-full object-contain object-center"
              onLoadingComplete={(img) =>
                setDims(img.naturalWidth, img.naturalHeight)
              }
              onError={() => setFailed(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              className="max-h-full max-w-full object-contain object-center"
              onLoad={(e) =>
                setDims(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
              }
              onError={() => setFailed(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
