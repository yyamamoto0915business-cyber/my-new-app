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
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes="44px"
        className="scale-[1.62] object-cover"
      />
    </div>
  );
}

function FeatureIcon({ id }: { id: (typeof FEATURES)[number]["id"] }) {
  if (id === "event") return <AuthFeatureEventIcon className="h-11 w-11" />;
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

      {/* ナビ直下から始め、右フォームと同じ上位置に揃える */}
      <div className="relative z-10 flex h-full min-h-0 flex-col justify-start px-10 pb-8 pt-8 xl:px-14 xl:pt-10">
        <div className="w-full max-w-[520px]">
          <h1
            className="text-[clamp(1.75rem,2.35vw,2.2rem)] font-semibold leading-[1.42] tracking-[0.01em] text-[#1e3828]"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            まちの出来事に、
            <br />
            もう一度出会う。
          </h1>
          <div
            className="mt-3.5 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-[#c9a227] via-[#d4ad2e] to-[#e8c96a]"
            aria-hidden
          />
          <p className="mt-4 max-w-[400px] text-[13.5px] leading-[1.8] text-[#3d5c48]">
            地域イベント、ボランティア、主催者の活動を
            <br />
            MachiGlyphで見つけられます。
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2.5 xl:mt-8 xl:gap-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="flex flex-col rounded-[16px] border border-white/85 bg-white/97 p-3 shadow-[0_8px_22px_rgba(30,56,40,0.09)] backdrop-blur-[3px] xl:p-3.5"
              >
                <FeatureIcon id={feature.id} />
                <p className="mt-2.5 text-[12px] font-semibold leading-snug text-[#1e3828] xl:text-[12.5px]">
                  {feature.title}
                </p>
                <p className="mt-1 text-[10px] leading-[1.6] text-[#5a7464] xl:text-[10.5px]">
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
