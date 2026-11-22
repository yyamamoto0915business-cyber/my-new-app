"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";

export type GameBasicsExample = { label: string; name: string; description: string };

/**
 * 基本の手順の「見本から入れる」（小さな文字）。押すと見本が並び、選ぶとゲーム名と説明がまとめて入る（あとから変えられる）。
 * 前は「例を入れる」で1つだけ入った。スタンプラリーの「見本から選ぶ」と同じ見た目にそろえる。
 */
export function GameBasicsExamples({
  examples,
  hasInput,
  onPick,
}: {
  examples: GameBasicsExample[];
  /** すでに名前か説明が入っているか（入っていれば、入れかえる前に確かめる） */
  hasInput: boolean;
  onPick: (example: GameBasicsExample) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      {/* 基本の手順では目立たせない：使いたい人だけ押す小さな文字 */}
      <div className="flex justify-end">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#a3812f] underline underline-offset-2"
        >
          <LayoutTemplate className="h-3.5 w-3.5" aria-hidden />
          {open ? "見本を閉じる" : "見本から入れる"}
        </button>
      </div>
      {open ? (
        <ul className="mt-2 grid gap-1.5">
          {examples.map((example) => (
            <li key={example.label}>
              <button
                type="button"
                onClick={() => {
                  if (hasInput && !window.confirm("いま入っているゲーム名と説明を、見本に入れかえますか？")) return;
                  onPick(example);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 rounded-[12px] border border-[#e6e2d6] bg-white px-3.5 py-2.5 text-left transition hover:border-[#c9a54e]"
              >
                <span className="text-[11px] font-bold text-[#a3812f]">{example.label}</span>
                <span className="text-[14px] font-bold text-[#163828]">{example.name}</span>
                <span className="line-clamp-2 text-[12px] leading-snug text-[#6b776f]">{example.description}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** ゲームの種類ごとの見本（ゲーム名と説明） */
export const GAME_BASICS_EXAMPLES: Record<string, GameBasicsExample[]> = {
  mission: [
    { label: "まち歩き", name: "春のまち発見ミッション", description: "まちを歩きながら、写真を撮ったりクイズに答えたりして、ミッションをクリアしよう！ぜんぶクリアすると特典がもらえます。" },
    { label: "お祭り", name: "夏祭りチャレンジミッション", description: "お祭り会場のあちこちに用意したミッションに挑戦しよう。屋台や会場の見どころを楽しみながら、特典を目指してください。" },
    { label: "子ども向け", name: "こども探検ミッション", description: "親子で楽しめるミッションです。まちの「ふしぎ」を見つけて、ぜんぶクリアしたらごほうびがもらえるよ！" },
  ],
  checkin: [
    { label: "まち歩き", name: "春のまち歩きチェックイン", description: "まちのスポットをめぐってチェックインしよう。すべてのスポットを巡ると、素敵な特典がもらえます。" },
    { label: "商店街", name: "商店街めぐりチェックイン", description: "商店街のお店をめぐってチェックイン。いつもは素通りしてしまうお店にも、立ち寄ってみてください。" },
    { label: "観光", name: "名所めぐりチェックイン", description: "まちの名所を訪れてチェックインしよう。観光の記念に、訪れた場所が記録に残ります。" },
  ],
  photo: [
    { label: "まち歩き", name: "まちの「好き」フォトラリー", description: "まちで見つけたお気に入りの景色を、写真で残しましょう。スポットで撮った写真がアルバムに並びます。" },
    { label: "季節", name: "秋の色さがしフォトラリー", description: "紅葉や実りなど、秋の色を見つけて撮影しよう。すべてのスポットで撮ると特典がもらえます。" },
    { label: "お祭り", name: "お祭りフォトラリー", description: "お祭りの楽しい瞬間を写真で集めよう。会場のスポットで撮影して、思い出を残してください。" },
  ],
  coupon: [
    { label: "グルメ", name: "まちなかグルメクーポンラリー", description: "まちなかの対象店舗をめぐって、お得なクーポンを集めよう。グルメ・ショッピングなど、いろいろなお店で使えます。" },
    { label: "商店街", name: "商店街お得めぐり", description: "商店街のお店をめぐるとクーポンがもらえます。お買い物のついでに、いろいろなお店を回ってみてください。" },
    { label: "イベント", name: "イベント限定クーポンラリー", description: "イベント期間だけの限定クーポンです。会場周辺のお店をめぐって、お得に楽しみましょう。" },
  ],
  quiz: [
    { label: "まち歩き", name: "春のまち歩きクイズ", description: "まちを歩きながらクイズに挑戦して、地域の歴史やスポットの魅力を発見しよう。全問正解で特典がもらえます。" },
    { label: "歴史", name: "まちの歴史クイズ", description: "まちに残る歴史の手がかりをたどりながら、クイズに答えよう。知らなかったまちの姿に出会えます。" },
    { label: "子ども向け", name: "こどもまちクイズ", description: "親子で楽しめるかんたんなクイズです。まちを歩いて答えを見つけてね！" },
  ],
  mystery: [
    { label: "まち歩き", name: "まちに隠された謎を解け", description: "まちのあちこちに隠された手がかりを集めて、最後の謎を解き明かそう。まち歩きと謎解きを一度に楽しめます。" },
    { label: "歴史", name: "城下町の秘密", description: "城下町に残る言い伝えをもとにした謎解きです。手がかりをたどって、まちの秘密にたどり着いてください。" },
    { label: "子ども向け", name: "なぞときたんけん", description: "親子で挑戦できるやさしい謎解きです。まちを探検して、ヒントを見つけよう！" },
  ],
};
