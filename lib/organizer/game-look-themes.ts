import { BG_THEME_SWATCH, type GameBgTheme } from "@/lib/organizer/game-experience";
import { FINE_DEFAULT, type GameLook, type GameLookFine, type GameLookTextKey } from "@/lib/organizer/game-look";

/**
 * 見た目のテーマ：背景の色と、見出しの書体などをまとめて変える組み合わせ。
 * いまある見た目の設定（GameLook の bgTheme と texts）だけを使うので、参加者の画面にもそのまま出る。
 * 濃い背景のテーマでは、見出し・種類・説明の文字を明るい色にして読めるようにする（画面のほうでは色が変わらないため）。
 */
export type GameLookTheme = {
  id: string;
  label: string;
  note: string;
  bgTheme: GameBgTheme;
  /** 見出し（タイトル）と、種類・説明の文字の調整 */
  title: Partial<GameLookFine>;
  kicker?: Partial<GameLookFine>;
  desc?: Partial<GameLookFine>;
};

export const GAME_LOOK_THEMES: GameLookTheme[] = [
  { id: "natural", label: "ナチュラル", note: "やさしい緑と明朝", bgTheme: "green", title: { font: "serif" }, kicker: { font: "serif" } },
  { id: "wa", label: "和風", note: "落ち着いた茶色と明朝", bgTheme: "brown", title: { font: "serif", spacing: 8 }, kicker: { font: "serif", spacing: 20 } },
  { id: "pop", label: "ポップ", note: "明るいオレンジと丸文字", bgTheme: "orange", title: { font: "round", bold: true } },
  { id: "cute", label: "かわいい", note: "ピンクと丸文字", bgTheme: "pink", title: { font: "round", bold: true }, desc: { font: "round" } },
  {
    id: "night",
    label: "夜祭り",
    note: "紺色と金色の光",
    bgTheme: "navy",
    title: { font: "serif", glow: "#e6d29b", glowSize: 12 },
    kicker: { font: "serif", spacing: 20 },
  },
  { id: "sky", label: "さわやか", note: "空色とゴシック", bgTheme: "sky", title: { font: "sans", bold: true } },
  { id: "modern", label: "モダン", note: "黒と太いゴシック", bgTheme: "black", title: { font: "sans", bold: true, spacing: 4 }, kicker: { spacing: 30 } },
  { id: "simple", label: "シンプル", note: "もとの色のまま、すっきり", bgTheme: "", title: { font: "sans" } },
];

/** テーマの見本に使う背景（もとの色は薄い灰色） */
export function themeSwatch(theme: GameLookTheme): string {
  return theme.bgTheme ? BG_THEME_SWATCH[theme.bgTheme] : "linear-gradient(160deg, #f7f6f2, #e9e6dc)";
}

const THEMED_KEYS: GameLookTextKey[] = ["title", "kicker", "desc", "meta"];

/** いまの見た目に、テーマを当てる（背景の色と、見出し・種類・説明の書体などだけを入れかえる。足した部品・写真はそのまま） */
/** 濃い背景のテーマ（文字を明るくする） */
const DARK_BG = new Set<GameBgTheme>(["brown", "green", "navy", "purple", "pink", "orange", "sky", "black"]);

export function applyGameLookTheme(current: GameLook, theme: GameLookTheme): GameLook {
  const texts = { ...current.texts };
  const dark = DARK_BG.has(theme.bgTheme);
  for (const key of THEMED_KEYS) {
    const fine = (key === "title" ? theme.title : key === "kicker" ? theme.kicker : key === "desc" ? theme.desc : undefined) ?? {};
    // 色はテーマで決める（濃い背景なら明るい色、そうでなければ画面のもとの色）
    const color = dark ? (key === "title" ? "#ffffff" : "#f1ede2") : "";
    texts[key] = { color, bg: "", ...FINE_DEFAULT, ...fine };
  }
  return { ...current, bgTheme: theme.bgTheme, texts };
}

/** いまの見た目が、自分で色や書体を変えたものか（テーマを当てる前に確かめるため） */
export function lookHasCustomStyle(look: GameLook): boolean {
  return Boolean(look.bgTheme) || Object.keys(look.texts ?? {}).length > 0;
}
