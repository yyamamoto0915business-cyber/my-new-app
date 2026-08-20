"use client";

import { Car, Ticket, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreHeroHighlight } from "@/lib/stores/hero-highlights";

type Props = {
  items: StoreHeroHighlight[];
  onSelect?: (id: StoreHeroHighlight["id"]) => void;
  className?: string;
};

function HighlightIcon({ tone }: { tone: StoreHeroHighlight["tone"] }) {
  const className = "size-5";
  switch (tone) {
    case "menu":
      return <UtensilsCrossed className={className} strokeWidth={2.1} aria-hidden />;
    case "coupon":
      return <Ticket className={className} strokeWidth={2.1} aria-hidden />;
    case "parking":
      return <Car className={className} strokeWidth={2.1} aria-hidden />;
  }
}

/** 店舗ヒーロー右下のカラーハイライトカード（新メニュー／クーポン／駐車場） */
export function StoreHeroHighlightCards({ items, onSelect, className }: Props) {
  if (items.length === 0) return null;

  return (
    <div className={cn("sd-highlights", className)} role="list">
      {items.map((item) => {
        const body = (
          <>
            <span className="sd-highlight__icon" aria-hidden>
              <HighlightIcon tone={item.tone} />
              {item.badge ? (
                <span className="sd-highlight__badge">{item.badge}</span>
              ) : null}
            </span>
            <span className="sd-highlight__label">{item.label}</span>
          </>
        );

        if (onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={cn("sd-highlight", `is-${item.tone}`)}
              onClick={() => onSelect(item.id)}
            >
              {body}
            </button>
          );
        }

        return (
          <div
            key={item.id}
            role="listitem"
            className={cn("sd-highlight", `is-${item.tone}`)}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}
