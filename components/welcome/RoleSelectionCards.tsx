"use client";

import { CalendarDays, HandHeart, Megaphone } from "lucide-react";
import { RoleCard } from "./RoleCard";

const CARDS = [
  {
    title: "イベントを探したい",
    description: "地域で開かれているイベントを見つけて参加できます",
    buttonLabel: "イベントを見る",
    href: "/events",
    icon: <CalendarDays className="h-5 w-5" strokeWidth={1.5} />,
    primary: true,
  },
  {
    title: "募集を見たい",
    description: "参加募集や、お手伝いの募集を探せます",
    buttonLabel: "募集を見る",
    href: "/recruitments",
    icon: <HandHeart className="h-5 w-5" strokeWidth={1.5} />,
    primary: false,
  },
  {
    title: "活動をはじめたい",
    description: "イベントを開いたり、募集を掲載したりできます",
    buttonLabel: "この使い方ではじめる",
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
