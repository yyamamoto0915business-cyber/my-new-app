"use client";

/** 上部：ラベル・タイトル・サブ文 */
export function WelcomeHero() {
  return (
    <header className="text-center" aria-label="MachiGlyphのご紹介">
      <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
        MachiGlyph
      </p>
      <h1 className="mt-3 font-serif text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
        まちの出来事に出会う
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
        イベントを探したい人も、募集を見たい人も、活動を主催したい人も、ここから始められます
      </p>
      <p className="mt-2 text-xs text-slate-500 sm:text-sm">
        参加する人も、主催する人も利用できます
      </p>
    </header>
  );
}
