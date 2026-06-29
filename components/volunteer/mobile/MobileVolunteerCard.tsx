"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";

export const MOBILE_VOLUNTEER_CARD_WIDTH = "calc((100% - 1rem) / 3)";

export type MobileVolunteerCardItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  dateLabel: string;
  areaLabel: string;
  tags: string[];
  href: string;
};

type Props = { item: MobileVolunteerCardItem };

export function MobileVolunteerCard({ item }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(item.href)}
      onKeyDown={(e) => e.key === "Enter" && router.push(item.href)}
      className="shrink-0 snap-start cursor-pointer overflow-hidden rounded-[12px] border border-[#DDE8DF] bg-white shadow-[0_2px_6px_rgba(45,122,79,0.06)]"
      style={{ width: MOBILE_VOLUNTEER_CARD_WIDTH }}
      aria-label={`${item.title}の詳細を見る`}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-[#EAF4ED]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="33vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4ec] via-[#eef6f2] to-[#f5f0e6]" />
        )}
        <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-[#2D7A4F] px-2 py-0.5 text-[9px] font-medium text-white">
          募集中
        </span>
        <button
          type="button"
          aria-label={saved ? "お気に入りから外す" : "お気に入りに追加"}
          onClick={(e) => {
            e.stopPropagation();
            setSaved((v) => !v);
          }}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Heart
            className={`h-3 w-3 ${saved ? "fill-[#E04444] text-[#E04444]" : "text-[#566358]"}`}
            aria-hidden
          />
        </button>
      </div>

      <div className="space-y-px p-1.5 pb-1.5">
        <p className="truncate text-[8px] leading-none text-[#566358]">{item.dateLabel}</p>
        <h3 className="line-clamp-1 text-[10px] font-semibold leading-tight text-[#1A2214]">
          {item.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[8px] leading-none text-[#566358]">
          <MapPin className="h-2.5 w-2.5 shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="truncate">{item.areaLabel}</span>
        </p>
        {item.tags.length > 0 && (
          <div className="flex gap-0.5 overflow-hidden">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex shrink-0 truncate rounded-full bg-[#E3F0E6] px-1.5 py-px text-[8px] font-medium text-[#2A6040]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function MobileVolunteerCardSkeleton() {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[12px] border border-[#DDE8DF] bg-white"
      style={{ width: MOBILE_VOLUNTEER_CARD_WIDTH }}
    >
      <div className="aspect-[3/2] animate-pulse bg-[#EAF4ED]" />
      <div className="space-y-1.5 p-2">
        <div className="h-2 w-2/3 animate-pulse rounded bg-[#EAF4ED]" />
        <div className="h-6 w-full animate-pulse rounded bg-[#EAF4ED]" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-[#EAF4ED]" />
      </div>
    </div>
  );
}
