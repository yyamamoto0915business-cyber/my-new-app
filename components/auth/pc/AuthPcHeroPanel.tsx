import Image from "next/image";
import { AuthFeatureEventIcon } from "./AuthFeatureIcons";

const FEATURES = [
  {
    id: "event" as const,
    title: "地域イベントを探す",
    description: "地域のイベントや活動を簡単に見つけられます",
  },
  {
    id: "volunteer" as const,
    title: "ボランティアに参加",
    description: "気になる活動に参加してまちに関われます",
  },
  {
    id: "support" as const,
    title: "まちの活動を応援",
    description: "地域を支える活動を応援することができます",
  },
] as const;

function FeatureImageIcon({ src }: { src: string }) {
  return (
    <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full">
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes="52px"
        className="scale-[1.62] object-cover"
      />
    </div>
  );
}

function FeatureIcon({ id }: { id: (typeof FEATURES)[number]["id"] }) {
  if (id === "event") return <AuthFeatureEventIcon />;
  if (id === "support") return <FeatureImageIcon src="/auth/icon-support-leaf.jpg" />;
  return <FeatureImageIcon src="/auth/icon-volunteer-card.jpg" />;
}

export function AuthPcHeroPanel() {
  return (
    <section
      className="relative flex h-full min-h-0 min-w-0 flex-[11] basis-0 flex-col overflow-hidden"
      aria-label="MachiGlyph の紹介"
    >
      <Image
        src="/auth/pc-hero-background.png"
        alt=""
        fill
        priority
        className="object-cover object-top"
        sizes="55vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% via-transparent to-[#eef4ee]/45"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-start px-10 pb-8 pt-[84px] xl:px-14 xl:pb-10 xl:pt-[92px]">
        <div className="w-full">
          <h1
            className="max-w-lg text-[clamp(1.85rem,2.5vw,2.35rem)] font-semibold leading-[1.42] tracking-[0.01em] text-[#1e3828]"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            まちの出来事に、
            <br />
            もう一度出会う。
          </h1>
          <div
            className="mt-4 h-[3px] w-[68px] rounded-full bg-gradient-to-r from-[#c9a227] via-[#d4ad2e] to-[#e8c96a]"
            aria-hidden
          />
          <p className="mt-5 max-w-[420px] text-[14px] leading-[1.85] text-[#3d5c48]">
            地域イベント、ボランティア、主催者の活動を
            <br />
            MachiGlyphで見つけられます。
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 xl:mt-9 xl:gap-3.5">
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="flex min-h-[136px] flex-col rounded-[18px] border border-white/85 bg-white/97 p-3.5 shadow-[0_10px_28px_rgba(30,56,40,0.1)] backdrop-blur-[3px] xl:min-h-[144px] xl:p-4"
              >
                <FeatureIcon id={feature.id} />
                <p className="mt-3 text-[12px] font-semibold leading-snug text-[#1e3828] xl:text-[13px]">
                  {feature.title}
                </p>
                <p className="mt-1.5 flex-1 text-[10px] leading-[1.65] text-[#5a7464] xl:text-[11px]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
