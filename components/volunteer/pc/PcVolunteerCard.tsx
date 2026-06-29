"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Heart } from "lucide-react";

type Props = {
  id: string;
  title: string;
  imageUrl?: string | null;
  dateLabel: string;
  areaLabel: string;
  tags: string[];
  href: string;
};

export function PcVolunteerCard({
  title,
  imageUrl,
  dateLabel,
  areaLabel,
  tags,
  href,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const hasImage = Boolean(imageUrl?.trim());

  const handleOpen = () => router.push(href);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[12px] border border-[#DDE8DF] bg-white transition hover:border-[#4CAF50] hover:shadow-[0_4px_16px_rgba(45,122,79,0.1)]"
      aria-label={`${title}の詳細を見る`}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#e8ede4]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#e8f4ec] via-[#eef6f2] to-[#f5f0e6]"
            aria-hidden
          />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-[#2D7A4F] px-2 py-0.5 text-[10px] font-medium text-white">
          募集中
        </span>
        <button
          type="button"
          aria-label={saved ? "お気に入りから外す" : "お気に入りに追加"}
          onClick={(e) => {
            e.stopPropagation();
            setSaved((v) => !v);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
        >
          <Heart
            className={`h-3.5 w-3.5 ${saved ? "fill-[#E04444] text-[#E04444]" : "text-[#566358]"}`}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex min-h-[108px] flex-1 flex-col px-3 pb-3 pt-2.5">
        <p className="mb-1 shrink-0 text-[11px] text-[#566358]">{dateLabel}</p>
        <h3 className="mb-1.5 line-clamp-2 min-h-[2.6em] text-[13px] font-semibold leading-[1.3] text-[#1A2214]">
          {title}
        </h3>
        <p className="mb-2 flex shrink-0 items-center gap-1 text-[11px] text-[#566358]">
          <MapPin className="h-3 w-3 shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="line-clamp-1">{areaLabel}</span>
        </p>
        <div className="mt-auto flex h-[22px] shrink-0 items-center gap-1 overflow-hidden">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex shrink-0 items-center rounded-full bg-[#E3F0E6] px-2 py-0.5 text-[10px] font-medium text-[#2A6040]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
