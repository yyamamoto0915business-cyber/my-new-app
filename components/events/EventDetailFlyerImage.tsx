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
  priority?: boolean;
  /** イベント詳細ヒーロー用の角丸（モバイルのみ角丸など） */
  variant?: "hero" | "cardTop";
  className?: string;
};

/**
 * イベント詳細向け：告知・フライヤー画像を切りすぎないよう max-height + contain を基本にし、
 * 横長写真のみ cover。読み取り後に縦横比で切り替える。
 */
export function EventDetailFlyerImage({
  imageUrl,
  alt,
  priority = false,
  variant = "hero",
  className,
}: Props) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const isWide = ratio !== null && ratio >= EVENT_FLYER_PORTRAIT_RATIO_THRESHOLD;

  const roundedCls =
    variant === "cardTop"
      ? "rounded-t-[22px]"
      : "max-sm:rounded-2xl sm:rounded-none";

  if (!imageUrl?.trim() || failed) {
    return (
      <div
        className={cn(
          "flex min-h-[160px] w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
          roundedCls,
          className
        )}
      >
        画像なし
      </div>
    );
  }

  const url = imageUrl.trim();
  const useNextImage = isEventImageHostAllowed(url);

  const shell = cn(
    "w-full overflow-hidden bg-slate-100/95 dark:bg-zinc-900/55",
    "p-3 sm:p-4 md:p-5",
    roundedCls,
    variant === "cardTop"
      ? "border-0"
      : "border border-slate-200/60 dark:border-zinc-700/50",
    className
  );

  const setDims = (w: number, h: number) => {
    if (w > 0 && h > 0) setRatio(w / h);
  };

  return (
    <div className={shell}>
      {isWide ? (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl bg-slate-200/40 dark:bg-zinc-950/40",
            "h-[min(52vw,360px)] sm:h-[min(36vw,520px)]"
          )}
        >
          {useNextImage ? (
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover object-center"
              priority={priority}
              onLoadingComplete={(img) => setDims(img.naturalWidth, img.naturalHeight)}
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
        <div className="flex w-full items-center justify-center">
          {useNextImage ? (
            <Image
              src={url}
              alt={alt}
              width={1200}
              height={1600}
              sizes="(max-width: 640px) calc(100vw - 2rem), 600px"
              className={cn(
                "h-auto w-auto max-w-full object-contain object-center",
                "max-h-[min(312px,calc(100vw-2.5rem))]",
                "sm:max-h-[min(472px,calc(100vw-5rem))]"
              )}
              priority={priority}
              onLoadingComplete={(img) => setDims(img.naturalWidth, img.naturalHeight)}
              onError={() => setFailed(true)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              className={cn(
                "h-auto w-auto max-w-full object-contain object-center",
                "max-h-[min(312px,calc(100vw-2.5rem))]",
                "sm:max-h-[min(472px,calc(100vw-5rem))]"
              )}
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
