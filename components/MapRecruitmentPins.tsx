"use client";

import Link from "next/link";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const HOME_X = 150;
const HOME_Y = 150;

/** おすすめ3件のピン座標（viewBox 1000x600 内） */
const PIN_POSITIONS = [
  { x: 380, y: 220 },
  { x: 620, y: 280 },
  { x: 450, y: 400 },
];

type Recruitment = {
  id: string;
  title: string;
  meeting_place: string | null;
  start_at: string | null;
  organizers?: { organization_name: string | null };
};

type Props = {
  recruitments: Recruitment[];
};

/**
 * 宝の地図上のおすすめ募集3ピン＋足あと道（点線）
 */
export function MapRecruitmentPins({ recruitments }: Props) {
  const items = recruitments.slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section
      className="relative mx-4 mb-6 overflow-hidden rounded-2xl border border-[var(--mg-line)]"
      style={{ backgroundColor: "var(--mg-paper)" }}
      aria-label="おすすめ募集"
    >
      {/* 地図エリア：SVGピン＋足あと道 */}
      <div className="relative aspect-[1000/600] w-full max-h-[320px]">
        <svg
          className="h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern
              id="footprint-path-dash"
              patternUnits="userSpaceOnUse"
              width="6"
              height="2"
            >
              <rect width="4" height="1" fill="var(--mg-ink)" opacity="0.35" />
            </pattern>
          </defs>
          {/* 足あと道：HOME → 各ピン */}
          {items.map((_, i) => {
            const pos = PIN_POSITIONS[i];
            if (!pos) return null;
            return (
              <line
                key={i}
                x1={HOME_X}
                y1={HOME_Y}
                x2={pos.x}
                y2={pos.y}
                stroke="url(#footprint-path-dash)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.6"
              />
            );
          })}
          {/* ピン（マーカー） */}
          {items.map((r, i) => {
            const pos = PIN_POSITIONS[i];
            if (!pos) return null;
            return (
              <a
                key={r.id}
                href={`/recruitments/${r.id}`}
                className="cursor-pointer [& circle]:hover:opacity-90"
              >
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r="12"
                    fill="var(--accent)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    y="6"
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {i + 1}
                  </text>
                </g>
              </a>
            );
          })}
          {/* HOME ラベル */}
          <text
            x={HOME_X}
            y={HOME_Y - 8}
            textAnchor="middle"
            fill="var(--mg-ink)"
            fontSize="12"
            opacity="0.6"
          >
            足あと
          </text>
        </svg>

        {/* ピンに対応するカードリンク（オーバーレイ） */}
        <div className="absolute inset-0 pointer-events-none" />
      </div>

      {/* クリッカブルなカード一覧（ピンの下） */}
      <div className="flex flex-wrap justify-center gap-3 p-4">
        {items.map((r, i) => (
          <Link
            key={r.id}
            href={`/recruitments/${r.id}`}
            className="pointer-events-auto flex max-w-[200px] shrink-0 flex-col rounded-xl border border-[var(--mg-line)] bg-white p-3 transition-shadow hover:shadow-md dark:bg-zinc-900/80 dark:border-zinc-700"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
              {i + 1}
            </span>
            <h3 className="mt-2 line-clamp-2 font-serif text-sm font-semibold">
              {r.title}
            </h3>
            {r.meeting_place && (
              <p className="mt-1 truncate text-xs text-zinc-500">
                📍 {r.meeting_place}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
