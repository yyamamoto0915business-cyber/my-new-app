"use client";

import { CalendarDays, MessagesSquare, Megaphone } from "lucide-react";
import { RoleCard } from "./RoleCard";

const CARDS = [
  {
    title: "まちの情報を探したい",
    description: (
      <>
        <span className="whitespace-nowrap">イベント・店舗・募集を</span>
        <br />
        <span className="whitespace-nowrap">まとめて探せます。</span>
      </>
    ),
    buttonLabel: "まちの情報を見る",
    href: "/",
    icon: <CalendarDays className="h-5 w-5" strokeWidth={1.5} />,
    primary: true,
  },
  {
    title: "みんなの投稿を見たい",
    description: (
      <>
        <span className="whitespace-nowrap">地域のみんなの投稿から、</span>
        <br />
        <span className="whitespace-nowrap">街の魅力を見つけられます。</span>
      </>
    ),
    buttonLabel: "みんなの投稿を見る",
    href: "/posts",
    icon: <MessagesSquare className="h-5 w-5" strokeWidth={1.5} />,
    primary: false,
  },
  {
    title: "イベントを掲載したい",
    description: "イベントを開いたり募集を掲載できます。",
    buttonLabel: "使い方を見る",
    href: "/auth?next=/organizer/listings",
    icon: <Megaphone className="h-5 w-5" strokeWidth={1.5} />,
    primary: false,
  },
];

export function RoleSelectionCards() {
  return (
    <nav
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
      aria-label="使い方を選ぶ"
    >
      {CARDS.map((card) => (
        <RoleCard
          key={card.href}
          icon={card.icon}
          title={card.title}
          description={card.description}
          buttonLabel={card.buttonLabel}
          href={card.href}
          primary={card.primary}
        />
      ))}
    </nav>
  );
}
