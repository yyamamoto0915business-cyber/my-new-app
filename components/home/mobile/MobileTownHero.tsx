import Image from "next/image";

const HERO_IMAGE = "/machi/hero-board-material-mobile.png";

/**
 * まちの情報（スマホ）：前のヒーロー（木目と紙の掲示板素材）を低くして戻したもの。
 * 検索欄はこの下端に重ねて置く（ホーム側で -mt をつける）。
 */
export function MobileTownHero() {
  return (
    <section aria-label="まちの情報" className="relative overflow-hidden rounded-[22px] shadow-[0_6px_20px_rgba(120,80,40,0.12)]">
      <div className="relative h-[124px] w-full tablet:h-[170px]">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 flex items-start justify-center px-5 pt-3">
          <div className="relative w-full max-w-[320px] rounded-[12px] border border-[#e6dbc8]/70 bg-[#fdfaf3]/85 px-4 py-2 text-center shadow-[0_4px_18px_rgba(120,80,40,0.10)] backdrop-blur-[1px] before:pointer-events-none before:absolute before:inset-[3px] before:rounded-[9px] before:border before:border-[#e0d3bd]/45 before:content-['']">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
              <span className="text-[9px] font-medium tracking-[0.24em] text-[#a08a68]">MACHI INFORMATION</span>
              <span className="h-px w-5 bg-[#cbbba0]" aria-hidden />
            </div>
            <h1
              className="mt-0.5 text-[18px] font-normal leading-[1.5] tracking-[0.08em] text-[#3a2a18]"
              style={{ fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              まちの魅力に、出会いにいく。
            </h1>
            <p className="text-[10.5px] tracking-[0.03em] text-[#6b5b48]">イベント・お店・募集を、ひとつの場所で。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
