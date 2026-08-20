"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORGANIZER_HOME_HREF } from "@/lib/organizer/organizer-nav";

const LEAF_ICON = "/assets/machiglyph/checkin/icons/leaf_icon.svg";

type Category = {
  id: string;
  title: string;
  description: string;
  iconSrc: string;
  illustSrc: string;
  theme: "event" | "store" | "kitchen" | "volunteer";
  href: string;
};

const CATEGORIES: Category[] = [
  {
    id: "event",
    title: "イベント",
    description: "お祭り・マルシェなど",
    iconSrc: "/organizer/listings/icon-event.png",
    illustSrc: "/organizer/listings/illust-event.png",
    theme: "event",
    href: "/organizer/events",
  },
  {
    id: "store",
    title: "店舗",
    description: "飲食店・商店など",
    iconSrc: "/organizer/listings/icon-store.png",
    illustSrc: "/organizer/listings/illust-store.png",
    theme: "store",
    href: "/organizer/stores",
  },
  {
    id: "kitchen",
    title: "キッチンカー",
    description: "出店・メニュー掲載",
    iconSrc: "/organizer/listings/icon-kitchen-car.png",
    illustSrc: "/organizer/listings/illust-kitchen-car.png",
    theme: "kitchen",
    href: "/organizer/kitchen-cars",
  },
  {
    id: "volunteer",
    title: "ボランティア募集",
    description: "スタッフ募集",
    iconSrc: "/organizer/listings/icon-volunteer.png",
    illustSrc: "/organizer/listings/illust-volunteer.png",
    theme: "volunteer",
    href: "/organizer/recruitments",
  },
];

type Props = {
  isOrganizerRegistered: boolean;
};

export function MypageMobileOrganize({ isOrganizerRegistered }: Props) {
  const gateHref = isOrganizerRegistered ? undefined : "/organizer/register";
  const listingsHref = gateHref ?? ORGANIZER_HOME_HREF;

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-[#18181a]">
          <Image src={LEAF_ICON} alt="" width={16} height={16} aria-hidden unoptimized />
          掲載する
        </h2>
        <Link
          href={listingsHref}
          className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#216B43]"
        >
          すべて見る
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      <div className="mypage-org-row">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={gateHref ?? category.href}
            className={cn("mypage-org-card", `is-${category.theme}`)}
            aria-label={category.title}
          >
            <div className="mypage-org-card__top">
              <span className="mypage-org-card__icon">
                <Image
                  src={category.iconSrc}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              </span>
              <p className="mypage-org-card__title">{category.title}</p>
              <p className="mypage-org-card__desc">{category.description}</p>
            </div>
            <div className="mypage-org-card__visual">
              <Image
                src={category.illustSrc}
                alt=""
                width={220}
                height={140}
                className="mypage-org-card__illust"
                unoptimized
              />
              <span className="mypage-org-card__arrow" aria-hidden>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
