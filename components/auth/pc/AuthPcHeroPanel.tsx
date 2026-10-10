import Image from "next/image";
import { Clock, HeartHandshake, LayoutGrid, type LucideIcon } from "lucide-react";

function KindWord({
  children,
  color,
  bg,
}: {
  children: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="mx-[1px] inline-block rounded-full px-1.5 py-0.5 text-[15px] font-semibold leading-none"
      style={{ color, background: bg, boxShadow: "0 1px 0 rgba(255,255,255,0.8)" }}
    >
      {children}
    </span>
  );
}

const FEATURES: {
  id: string;
  title: string;
  lines: readonly string[];
  Icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  {
    id: "find",
    title: "まちの情報を探す",
    lines: ["イベント・お店を", "まとめて探せます"],
    Icon: LayoutGrid,
    color: "#2f7d4e",
    bg: "#eef6f0",
  },
  {
    id: "connect",
    title: "主催者とつながる",
    lines: ["気になる活動に", "直接つながれます"],
    Icon: HeartHandshake,
    color: "#c05a7a",
    bg: "#fceef3",
  },
  {
    id: "record",
    title: "参加の記録が残る",
    lines: ["参加もお手伝いも", "記録に残ります"],
    Icon: Clock,
    color: "#2d7a4f",
    bg: "#e8f4ec",
  },
];

export function AuthPcHeroPanel() {
  return (
    <section
      className="relative flex h-full min-h-0 min-w-0 flex-[11] basis-0 flex-col overflow-hidden"
      aria-label="MachiGlyph の紹介"
    >
      <Image
        src="/auth/pc-hero-street-v2.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_22%]"
        sizes="55vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,252,246,0.78)_0%,rgba(255,252,246,0.46)_26%,transparent_50%)]"
        aria-hidden
      />

      {/* ナビ直下から始め、右フォームと同じ上位置に揃える */}
      <div className="relative z-10 flex h-full min-h-0 flex-col justify-start px-10 pb-8 pt-8 xl:px-14 xl:pt-10">
        <div className="w-full max-w-[520px]">
          <h1
            className="text-[clamp(1.95rem,2.6vw,2.45rem)] font-semibold leading-[1.38] tracking-[0.01em] text-[#14281c]"
            style={{
              fontFamily: "var(--font-serif-display)",
              textShadow:
                "0 1px 0 rgba(255,252,246,0.95), 0 10px 28px rgba(255,252,246,0.85)",
            }}
          >
            まちの魅力に、
            <br />
            出会いにいく。
          </h1>
          <div
            className="mt-3.5 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-[#c9a227] via-[#d4ad2e] to-[#e8c96a]"
            aria-hidden
          />
          <p className="mt-4 max-w-[460px] text-[15.5px] font-medium leading-[2.05] text-[#1a3324]">
            <KindWord color="#2f7d4e" bg="#e7f6ec">イベント</KindWord>{"、"}
            <KindWord color="#3d6eae" bg="#e8f1fb">お店</KindWord>{"、"}
            <KindWord color="#c05a7a" bg="#fdeef3">ボランティア</KindWord>{"、"}
            <br />
            <KindWord color="#d4843a" bg="#fdf1e4">キッチンカー</KindWord>{"、"}
            <KindWord color="#2d7a4f" bg="#e7f6ec">ゲーム</KindWord>
            を見つけられます。
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2.5 xl:mt-8 xl:gap-3">
            {FEATURES.map((feature) => {
              const Icon = feature.Icon;
              return (
              <div
                key={feature.id}
                className="flex flex-col rounded-[16px] border border-white/85 bg-white/97 p-3 shadow-[0_8px_22px_rgba(30,56,40,0.09)] backdrop-blur-[3px] xl:p-3.5"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: feature.bg, color: feature.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-2.5 text-[12px] font-semibold leading-snug text-[#1e3828] xl:text-[12.5px]">
                  {feature.title}
                </p>
                <p className="mt-1 text-[10px] leading-[1.6] text-[#5a7464] xl:text-[10.5px]">
                  {feature.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
