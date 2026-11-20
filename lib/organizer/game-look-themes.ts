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
  /** 背景の絵（季節のテーマなど）。ないテーマは絵を外す */
  bgImageUrl?: string;
  /** はじめから組み合わせるキャラクター（あとで変えられる） */
  character?: string;
  /** まとまり（シートの見出し） */
  group: "color" | "season";
  /** 見出し（タイトル）と、種類・説明の文字の調整 */
  title: Partial<GameLookFine>;
  kicker?: Partial<GameLookFine>;
  desc?: Partial<GameLookFine>;
};

export const GAME_LOOK_THEMES: GameLookTheme[] = [
  { id: "natural", group: "color", label: "ナチュラル", note: "やさしい緑と明朝", bgTheme: "green", title: { font: "serif" }, kicker: { font: "serif" } },
  { id: "wa", group: "color", label: "和風", note: "落ち着いた茶色と明朝", bgTheme: "brown", title: { font: "serif", spacing: 8 }, kicker: { font: "serif", spacing: 20 } },
  { id: "pop", group: "color", label: "ポップ", note: "明るいオレンジと丸文字", bgTheme: "orange", title: { font: "round", bold: true } },
  { id: "cute", group: "color", label: "かわいい", note: "ピンクと丸文字", bgTheme: "pink", title: { font: "round", bold: true }, desc: { font: "round" } },
  {
    id: "night",
    group: "color",
    label: "夜祭り",
    note: "紺色と金色の光",
    bgTheme: "navy",
    title: { font: "serif", glow: "#e6d29b", glowSize: 12 },
    kicker: { font: "serif", spacing: 20 },
  },
  { id: "sky", group: "color", label: "さわやか", note: "空色とゴシック", bgTheme: "sky", title: { font: "sans", bold: true } },
  { id: "modern", group: "color", label: "モダン", note: "黒と太いゴシック", bgTheme: "black", title: { font: "sans", bold: true, spacing: 4 }, kicker: { spacing: 30 } },
  { id: "simple", group: "color", label: "シンプル", note: "もとの色のまま、すっきり", bgTheme: "", title: { font: "sans" } },
  // 季節：水彩の絵を背景に（絵の上は少し暗くして、文字を読みやすく）
  { id: "spring", group: "season", label: "春", note: "桜の水彩と明朝", bgTheme: "pink", bgImageUrl: "/profile/album/season-spring.jpg", character: "/organizer/games/hub-mascot-photo.png", title: { font: "serif" }, kicker: { font: "serif", spacing: 20 } },
  { id: "summer", group: "season", label: "夏", note: "夏祭りの水彩と丸文字", bgTheme: "sky", bgImageUrl: "/profile/album/season-summer.jpg", character: "/organizer/games/hub-mascot-stamp.png", title: { font: "round", bold: true } },
  { id: "autumn", group: "season", label: "秋", note: "紅葉の水彩と明朝", bgTheme: "orange", bgImageUrl: "/profile/album/season-autumn.jpg", character: "/organizer/games/hub-mascot-mission.png", title: { font: "serif" }, kicker: { font: "serif", spacing: 20 } },
  { id: "winter", group: "season", label: "冬", note: "雪の水彩とゴシック", bgTheme: "navy", bgImageUrl: "/profile/album/season-winter.jpg", character: "/organizer/games/hub-mascot-quiz.png", title: { font: "sans", bold: true, glow: "#ffffff", glowSize: 8 } },
];

/** キャラクター（真ん中のアイコンを、アプリのマスコットに変える）。空は「もとのアイコン」 */
export const GAME_LOOK_CHARACTERS: { url: string; label: string }[] = [
  { url: "", label: "もとのアイコン" },
  { url: "/organizer/games/hub-mascot.png", label: "旗" },
  { url: "/organizer/games/hub-mascot-stamp.png", label: "スタンプ" },
  { url: "/organizer/games/hub-mascot-mission.png", label: "地図" },
  { url: "/organizer/games/hub-mascot-photo.png", label: "カメラ" },
  { url: "/organizer/games/hub-mascot-quiz.png", label: "はてな" },
  { url: "/organizer/games/hub-mascot-mystery.png", label: "なぞとき" },
  { url: "/organizer/games/hub-mascot-coupon.png", label: "クーポン" },
];

/** テーマの見本に使う背景（もとの色は薄い灰色） */
export function themeSwatch(theme: GameLookTheme): string {
  if (theme.bgImageUrl) return `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url("${theme.bgImageUrl}") center / cover`;
  return theme.bgTheme ? BG_THEME_SWATCH[theme.bgTheme] : "linear-gradient(160deg, #f7f6f2, #e9e6dc)";
}

const THEMED_KEYS: GameLookTextKey[] = ["title", "kicker", "desc", "meta"];

/** いまの見た目に、テーマを当てる（背景の色と、見出し・種類・説明の書体などだけを入れかえる。足した部品・写真はそのまま） */
/** 濃い背景のテーマ（文字を明るくする） */
const DARK_BG = new Set<GameBgTheme>(["brown", "green", "navy", "purple", "pink", "orange", "sky", "black"]);

export function applyGameLookTheme(current: GameLook, theme: GameLookTheme): GameLook {
  const texts = { ...current.texts };
  const dark = DARK_BG.has(theme.bgTheme) || Boolean(theme.bgImageUrl);
  for (const key of THEMED_KEYS) {
    const fine = (key === "title" ? theme.title : key === "kicker" ? theme.kicker : key === "desc" ? theme.desc : undefined) ?? {};
    // 色はテーマで決める（濃い背景なら明るい色、そうでなければ画面のもとの色）
    const color = dark ? (key === "title" ? "#ffffff" : "#f1ede2") : "";
    texts[key] = { color, bg: "", ...FINE_DEFAULT, ...fine };
  }
  return {
    ...current,
    bgTheme: theme.bgTheme,
    texts,
    // 絵のあるテーマは絵を入れ、上を少し暗くして文字を読みやすく。絵のないテーマは絵を外す
    bgImageUrl: theme.bgImageUrl ?? "",
    shade: theme.bgImageUrl ? "strong" : current.shade,
    // キャラクターはテーマに組み合わせがあるときだけ変える（あとで「キャラクター」から変えられる）
    iconImageUrl: theme.character ?? current.iconImageUrl,
  };
}

/** いまの見た目が、自分で色や書体を変えたものか（テーマを当てる前に確かめるため） */
export function lookHasCustomStyle(look: GameLook): boolean {
  return Boolean(look.bgTheme) || Boolean(look.bgImageUrl) || Object.keys(look.texts ?? {}).length > 0;
}
