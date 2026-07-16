import { cn } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";
import type { ReactNode } from "react";

export const HERO_TITLE_SHADOW = [
  "0 0 1px #fff",
  "0 0 2px #fff",
  "1px 0 0 #fff",
  "-1px 0 0 #fff",
  "0 1px 0 #fff",
  "0 -1px 0 #fff",
  "1px 1px 0 #fff",
  "-1px 1px 0 #fff",
  "1px -1px 0 #fff",
  "-1px -1px 0 #fff",
  "2px 0 0 rgba(255,255,255,0.85)",
  "-2px 0 0 rgba(255,255,255,0.85)",
  "0 2px 0 rgba(255,255,255,0.85)",
  "0 -2px 0 rgba(255,255,255,0.85)",
  "0 0 10px rgba(255,255,255,1)",
  "0 0 18px rgba(255,255,255,0.95)",
  "0 0 28px rgba(255,255,255,0.75)",
  "0 2px 6px rgba(22,59,46,0.14)",
].join(", ");

export function HeroSparkRays({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 20 16" fill="none" aria-hidden>
      <path d="M10 14V4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 12 4.5 5.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 12 15.5 5.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function HeroLeafMark({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none inline-block", className)} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.2 10.8C4.2 6 8.2 3 12 2.2c-.2 3.8-2.8 7.4-7.4 8.6-.4-1.1-.9-2-2.4-.4Z"
        fill="#5B9E5A"
      />
    </svg>
  );
}

function LabelUnderline({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none block", className)} viewBox="0 0 112 8" fill="none" aria-hidden>
      <path d="M6 6h94" stroke="#c46828" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6 6V2.4M100 6V2.4" stroke="#c46828" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LabelSparkles({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 18 10" fill="none" aria-hidden>
      <path d="M4.5 1 5 2.5H6.7L5.45 3.45 5.95 5 4.5 4.1 3.05 5 3.55 3.45 2.3 2.5H4L4.5 1Z" fill="#E8B84A" />
      <path d="M13 2.2 13.35 3.3H14.6L13.7 4l.35 1.1L13 4.45l-.95.65.35-1.1-.9-.7h1.25L13 2.2Z" fill="#F0C85A" />
    </svg>
  );
}

function DottedLeafUnderline({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 120 10" fill="none" aria-hidden>
      <path
        d="M2 5.5h98"
        stroke="#5B9E5A"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 3.2"
        opacity="0.7"
      />
      <path
        d="M104 7.2c1-2.2 3-3.6 4.9-4-.15 1.9-1.35 3.7-3.8 4.4-.25-.55-.5-1-1.1-.4Z"
        fill="#5B9E5A"
      />
    </svg>
  );
}

export function SearchLeafIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none shrink-0", className)} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.2 10.8C4.2 6 8.2 3 12 2.2c-.2 3.8-2.8 7.4-7.4 8.6-.4-1.1-.9-2-2.4-.4Z"
        fill="#5B9E5A"
        fillOpacity="0.9"
      />
    </svg>
  );
}

type SectionHeroCopyProps = {
  size?: "mobile" | "pc";
  label: string;
  /** 1行タイトル（nowrap）。アクセント色は呼び出し側で付与 */
  title: ReactNode;
  subcopy: string;
  /** サブコピー末尾に点線を引く文言（省略可） */
  underlineTail?: string;
  className?: string;
};

/**
 * 発見／イベント／ボランティア共通のヒーローコピー見た目
 */
export function SectionHeroCopy({
  size = "mobile",
  label,
  title,
  subcopy,
  underlineTail,
  className,
}: SectionHeroCopyProps) {
  const isPc = size === "pc";
  const [head, tail] = underlineTail
    ? (() => {
        const idx = subcopy.lastIndexOf(underlineTail);
        if (idx < 0) return [subcopy, null] as const;
        return [subcopy.slice(0, idx), underlineTail] as const;
      })()
    : [subcopy, null] as const;

  return (
    <div className={cn("@container min-w-0", className)}>
      <div className={cn("relative w-fit", isPc ? "mb-1.5" : "mb-0.5")}>
        <LabelSparkles
          className={cn("absolute -right-1", isPc ? "-top-3 h-3 w-4" : "-top-2 h-2 w-3.5")}
        />
        <p
          className={cn(
            "inline-flex items-center gap-1 font-semibold tracking-[0.05em] text-[#c46828]",
            isPc ? "text-[12px]" : "text-[9px]"
          )}
        >
          <Search
            className={cn("shrink-0", isPc ? "h-3 w-3" : "h-2.5 w-2.5")}
            strokeWidth={2.5}
            aria-hidden
          />
          {label}
        </p>
        <LabelUnderline className={cn(isPc ? "mt-0.5 h-1.5 w-[7rem]" : "mt-px h-1.5 w-[5.75rem]")} />
      </div>

      <div className={cn("relative min-w-0", isPc ? "pl-5 pt-0.5" : "pl-3 pt-0")}>
        <div
          className="pointer-events-none absolute inset-y-[-4px] left-0 right-0 -z-0 rounded-full bg-[radial-gradient(ellipse_at_left,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0.55)_45%,_transparent_75%)]"
          aria-hidden
        />
        <HeroSparkRays
          color="#5B9E5A"
          className={cn(
            "absolute left-0 top-1/2 z-[1] -translate-y-[70%]",
            isPc ? "h-5 w-5" : "h-3 w-3"
          )}
        />
        <h1
          className={cn(
            "discover-hero-title relative z-[1] inline-flex max-w-full flex-nowrap items-baseline whitespace-nowrap text-[#163B2E]",
            "tracking-[-0.02em] leading-[1.1]",
            isPc
              ? "text-[clamp(1.25rem,4.8cqi,1.875rem)]"
              : "text-[clamp(0.9rem,4.4vw,1.15rem)]"
          )}
          style={{ textShadow: HERO_TITLE_SHADOW }}
        >
          {title}
          <HeroLeafMark className={cn("ml-0.5 shrink-0 self-center", isPc ? "h-4 w-4" : "h-2.5 w-2.5")} />
        </h1>
      </div>

      <div className={cn("relative w-fit", isPc ? "mt-2" : "mt-1")}>
        <p
          className={cn(
            "flex items-center gap-1 font-medium text-[#4a5560]",
            isPc ? "text-[12px] leading-snug" : "text-[9px] leading-snug"
          )}
        >
          <MapPin
            className={cn("shrink-0 text-[#5B9E5A]", isPc ? "h-3.5 w-3.5" : "h-2.5 w-2.5")}
            strokeWidth={2.25}
            aria-hidden
          />
          <span>
            {head}
            {tail ? (
              <span className="relative inline pb-1">
                {tail}
                <DottedLeafUnderline
                  className={cn(
                    "absolute bottom-0 left-0",
                    isPc ? "h-2.5 w-[7.25rem]" : "h-1.5 w-[5rem]"
                  )}
                />
              </span>
            ) : null}
          </span>
        </p>
      </div>
    </div>
  );
}
