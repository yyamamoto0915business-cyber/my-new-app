"use client";

import { useId, useState } from "react";

export type OrganizerManagementHeroBannerProps = {
  labelEn: string;
  titleJa: string;
  /** 省略時はサブタイトル行を出さない */
  subtitleJa?: string;
  /** ダッシュボード等でモバイルの高さを抑える */
  compact?: boolean;
  /** 一覧ページ向け。PCのバナー高さをさらに抑える */
  dense?: boolean;
};

type TimeOfDay = "morning" | "day" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 20) return "day";
  return "night";
}

const GRADIENTS: Record<TimeOfDay, [string, string]> = {
  morning: ["#E8855A", "#C06038"],
  day: ["#2E7BA8", "#1E5F85"],
  night: ["#0D1B2A", "#1A1F35"],
};

export function OrganizerManagementHeroBanner({
  labelEn,
  titleJa,
  subtitleJa,
  compact = false,
  dense = false,
}: OrganizerManagementHeroBannerProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `org-mh-grad-${uid}`;
  const pid = `org-mh-shippo-${uid}`;
  const [time, setTime] = useState<TimeOfDay>(() => getTimeOfDay());
  const [g0, g1] = GRADIENTS[time];

  const timeToggle = (
    <div className="flex shrink-0 gap-0.5">
      {(["morning", "day", "night"] as TimeOfDay[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTime(t)}
          style={{
            fontSize: dense ? 9 : 10,
            padding: dense ? "2px 8px" : "3px 10px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: time === t ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)",
            color: time === t ? "#fff" : "rgba(255,255,255,0.5)",
            fontWeight: time === t ? 600 : 400,
            fontFamily: "inherit",
          }}
        >
          {t === "morning" ? "🌅 朝" : t === "day" ? "☀️ 昼" : "🌙 夜"}
        </button>
      ))}
    </div>
  );

  if (dense) {
    return (
      <div className="relative overflow-hidden border-b-[3px] border-[#c8a84b] h-[50px] min-[900px]:h-[52px]">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${g0} 0%, ${g1} 100%)` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, #fff 0 1px, transparent 1px), radial-gradient(circle at 75% 50%, #fff 0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="relative z-[2] flex h-full items-center justify-between gap-3 px-4 min-[900px]:px-6">
          <div className="flex min-w-0 items-baseline gap-2 min-[900px]:gap-2.5">
            <p className="shrink-0 text-[8px] font-bold tracking-[0.14em] text-[#E8C547] min-[900px]:text-[9px] min-[900px]:tracking-[0.16em]">
              {labelEn}
            </p>
            <p className="truncate font-serif text-[15px] font-light leading-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] min-[900px]:text-[17px]">
              {titleJa}
            </p>
          </div>
          <div className="hidden min-[900px]:block">{timeToggle}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border-b-[3px] border-[#c8a84b] ${
        compact ? "h-[54px] min-[900px]:h-[130px]" : "h-[76px] min-[900px]:h-[130px]"
      }`}
    >
      <div className="absolute right-3.5 top-[22px] z-10 hidden min-[900px]:flex min-[900px]:gap-1">
        {timeToggle}
      </div>

      <svg
        viewBox="0 0 1200 130"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={g0} />
            <stop offset="100%" stopColor={g1} />
          </linearGradient>
          <pattern id={pid} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="23" fill="none" stroke="#fff" strokeWidth=".6" opacity=".08" />
            <circle cx="0" cy="0" r="23" fill="none" stroke="#fff" strokeWidth=".6" opacity=".08" />
            <circle cx="50" cy="0" r="23" fill="none" stroke="#fff" strokeWidth=".6" opacity=".08" />
            <circle cx="0" cy="50" r="23" fill="none" stroke="#fff" strokeWidth=".6" opacity=".08" />
            <circle cx="50" cy="50" r="23" fill="none" stroke="#fff" strokeWidth=".6" opacity=".08" />
          </pattern>
        </defs>

        <rect width="1200" height="130" fill={`url(#${gid})`} />
        <rect width="1200" height="130" fill={`url(#${pid})`} />
        <line x1="420" y1="0" x2="420" y2="130" stroke="#fff" strokeWidth=".5" opacity=".07" />

        <g transform="translate(210,55)" opacity=".1">
          <circle cx="0" cy="0" r="34" fill="none" stroke="#fff" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="22" fill="none" stroke="#fff" strokeWidth=".7" />
          <circle cx="0" cy="0" r="4" fill="#fff" />
          <line x1="0" y1="-34" x2="0" y2="34" stroke="#fff" strokeWidth=".7" />
          <line x1="-34" y1="0" x2="34" y2="0" stroke="#fff" strokeWidth=".7" />
        </g>

        <g transform="translate(935,20)" opacity=".09">
          <circle cx="35" cy="35" r="28" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="35" cy="35" r="14" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="35" cy="35" r="5" fill="#fff" opacity=".6" />
          <line x1="35" y1="3" x2="35" y2="14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="56" x2="35" y2="67" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="3" y1="35" x2="14" y2="35" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="35" x2="67" y2="35" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="13" y1="13" x2="21" y2="21" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="49" y1="49" x2="57" y2="57" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="57" y1="13" x2="49" y2="21" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="21" y1="49" x2="13" y2="57" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>

        <g transform="translate(1060,38)" opacity=".06">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="22" cy="22" r="9" fill="none" stroke="#fff" strokeWidth="2" />
          <line x1="22" y1="2" x2="22" y2="9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="35" x2="22" y2="42" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="2" y1="22" x2="9" y2="22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="22" x2="42" y2="22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        <g transform="translate(1020,0)" opacity=".38">
          <rect x="40" y="95" width="7" height="35" fill="#2d5a2d" rx="2" />
          <ellipse cx="43" cy="93" rx="40" ry="22" fill="#2d6e3a" />
          <ellipse cx="43" cy="68" rx="30" ry="17" fill="#357a40" />
          <ellipse cx="43" cy="46" rx="22" ry="13" fill="#3d8a48" />
          <ellipse cx="43" cy="27" rx="15" ry="10" fill="#45984e" />
        </g>

        {time === "morning" && (
          <g>
            <circle cx="80" cy="120" r="40" fill="#FFE5A0" opacity=".18" />
            <circle cx="80" cy="120" r="24" fill="#FFD97A" opacity=".28" />
            <circle cx="80" cy="120" r="14" fill="#FFCC44" opacity=".48" />
          </g>
        )}
        {time === "night" && (
          <>
            <circle cx="310" cy="30" r="16" fill="#fff" opacity=".9" />
            <circle cx="318" cy="26" r="14" fill="#0D1B2A" />
            <circle cx="60" cy="18" r="1.5" fill="#fff" />
            <circle cx="130" cy="10" r="1.1" fill="#fff" />
            <circle cx="200" cy="24" r="1.3" fill="#fff" />
            <circle cx="800" cy="16" r="1" fill="#fff" />
          </>
        )}
      </svg>

      <div
        className={`absolute left-4 right-3 z-[2] max-w-[min(920px,calc(100%-80px))] min-[900px]:left-6 ${
          compact ? "bottom-2 min-[900px]:bottom-4" : "bottom-2.5 min-[900px]:bottom-4"
        }`}
      >
        <p className="mb-0.5 font-bold text-[#E8C547] text-[9px] tracking-[0.15em] [text-shadow:0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.45)] min-[900px]:mb-[3px] min-[900px]:text-[10px] min-[900px]:tracking-[0.18em]">
          {labelEn}
        </p>
        <p className="font-serif font-light leading-tight text-white text-[15px] leading-none [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.28)] min-[900px]:text-[clamp(20px,4.8vw,26px)] min-[900px]:leading-snug">
          {titleJa}
        </p>
        {subtitleJa ? (
          <p className="mt-0.5 hidden text-xs font-medium text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] min-[900px]:mt-1 min-[900px]:block">
            {subtitleJa}
          </p>
        ) : null}
      </div>
    </div>
  );
}
