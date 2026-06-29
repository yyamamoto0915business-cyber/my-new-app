"use client";

import { CalendarDays, HandHeart, Megaphone } from "lucide-react";
import { RoleCard } from "./RoleCard";

const CARDS = [
  {
    title: "イベントを探したい",
    description: (
      <>
        <span className="whitespace-nowrap">地域で開催されるイベントを</span>
        <br />
        <span className="whitespace-nowrap">見つけて参加できます。</span>
      </>
    ),
    buttonLabel: "イベントを見る",
    href: "/events",
    icon: <CalendarDays className="h-5 w-5" strokeWidth={1.5} />,
    primary: true,
  },
  {
    title: "募集を見たい",
    description: (
      <>
        <span className="whitespace-nowrap">ボランティアやまちおこしの</span>
        <br />
        <span className="whitespace-nowrap">募集を見つけられます。</span>
      </>
    ),
    buttonLabel: "募集を見る",
    href: "/volunteer",
    icon: <HandHeart className="h-5 w-5" strokeWidth={1.5} />,
    primary: false,
  },
  {
    title: "イベントを掲載したい",
    description: "イベントを開いたり募集を掲載できます。",
    buttonLabel: "使い方を見る",
    href: "/auth?next=/organizer",
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
