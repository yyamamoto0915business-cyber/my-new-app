"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buildDetailImageList } from "@/lib/gallery-images";

type Props = {
  coverUrl: string | null | undefined;
  galleryImages?: string[] | null;
  alt: string;
  className?: string;
  /** メイン画像の描画（選択中 URL を渡す） */
  renderMain: (activeUrl: string | null) => React.ReactNode;
  /** サムネ列の位置 */
  thumbsPlacement?: "below" | "overlay";
};

/**
 * 詳細画面用: 代表 + ギャラリーをサムネで切り替える。
 * 1枚以下のときはサムネ列を出さない。
 */
export function DetailImageSwitcher({
  coverUrl,
  galleryImages,
  alt,
  className,
  renderMain,
  thumbsPlacement = "below",
}: Props) {
  const images = buildDetailImageList(coverUrl, galleryImages);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [coverUrl, galleryImages?.join("|")]);

  const safeIndex = images.length === 0 ? 0 : Math.min(index, images.length - 1);
  const activeUrl = images[safeIndex] ?? null;
  const showThumbs = images.length > 1;

  const thumbs = showThumbs ? (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        thumbsPlacement === "overlay" && "absolute bottom-2 left-2 right-2 z-10"
      )}
      role="tablist"
      aria-label="画像一覧"
    >
      {images.map((url, i) => {
        const selected = i === safeIndex;
        return (
          <button
            key={`${url}-${i}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${alt} ${i + 1}枚目`}
            onClick={() => setIndex(i)}
            className={cn(
              "relative h-11 w-11 shrink-0 overflow-hidden rounded-[7px] border-2 transition",
              selected
                ? "border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
                : "border-transparent opacity-85 hover:opacity-100"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {thumbsPlacement === "overlay" && !selected ? (
              <span className="absolute inset-0 bg-black/25" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={cn("relative", className)}>
      {renderMain(activeUrl)}
      {thumbsPlacement === "overlay" ? thumbs : null}
      {thumbsPlacement === "below" && thumbs ? (
        <div className="mt-2 px-0.5">{thumbs}</div>
      ) : null}
    </div>
  );
}
