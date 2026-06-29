"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export type SelectPopoverOption = {
  value: string;
  label: string;
};

const VIEWPORT_PAD = 16;
const GAP_BELOW = 8;
const MIN_WIDTH = 168;
const MAX_WIDTH = 280;

type Props = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  options: SelectPopoverOption[];
  value: string;
  onSelect: (value: string) => void;
  onDismiss?: () => void;
  scrollable?: boolean;
};

export function EventsMobileSelectPopover({
  open,
  anchorRef,
  options,
  value,
  onSelect,
  onDismiss,
  scrollable = false,
}: Props) {
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
    caretLeft: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, vw - VIEWPORT_PAD * 2));

      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - width));

      const caretLeft = Math.min(
        width - 12,
        Math.max(12, rect.left + rect.width / 2 - left)
      );

      setPos({
        top: rect.bottom + GAP_BELOW,
        left,
        width,
        caretLeft,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, options.length]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        aria-hidden
        onClick={onDismiss}
      />
      <div
        className="fixed z-[61]"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        role="listbox"
      >
        <div
          className="absolute top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-[#E0E6DE] bg-white"
          style={{ left: pos.caretLeft }}
          aria-hidden
        />

        <div
          className={`overflow-hidden rounded-[12px] border border-[#E0E6DE] bg-white shadow-[0_8px_24px_rgba(34,51,68,0.12)] ${
            scrollable ? "max-h-[min(280px,50dvh)] overflow-y-auto" : ""
          }`}
        >
          {options.map((opt, i) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(opt.value)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 px-3.5 text-left text-[13px] transition active:bg-[#F7F8F6] ${
                  selected ? "bg-[#E8F2EA] font-medium text-[#4A8C5E]" : "text-[#223344]"
                } ${i > 0 ? "border-t border-[#E8EAE6]" : ""}`}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
                {selected ? (
                  <Check className="h-4 w-4 shrink-0 text-[#4A8C5E]" strokeWidth={2.5} aria-hidden />
                ) : (
                  <span className="w-4 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
