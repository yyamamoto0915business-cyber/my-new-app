import {
  BG_THEMES,
  START_LOOK_SHADES,
  safeImageUrl,
  sanitizeStartImages,
  sanitizeStartOffsets,
  sanitizeStartShapes,
  START_TEXT_MAX,
  type GameBgTheme,
  type GameStartImage,
  type GameStartShape,
  type StartOffset,
} from "@/lib/organizer/game-experience";

/**
 * 文字の細かい調整（ワード・パワポの「フォント」「文字の効果」のように）。
 * 数値はどれも、はじめの値（FINE_DEFAULT）のとき何もしない。
 */
export type GameLookFine = {
  /** 大きさ（%）。 */
  scale: number;
  /** 字間（1/100 文字ぶん）。 */
  spacing: number;
  /** 行間（%）。0 はもとのまま。 */
  leading: number;
  align: "" | "left" | "center" | "right";
  font: "" | "sans" | "serif" | "round" | "mono";
  /** 文字の不透明度（%）。 */
  opacity: number;
  bold: boolean;
  /** 影（黒）。濃さ 0 でなし。位置とぼかしは px。 */
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowAlpha: number;
  /** 光彩の色（空でなし）と広がり（px）。 */
  glow: string;
  glowSize: number;
  /** 縁取りの色（空でなし）と太さ（px）。 */
  stroke: string;
  strokeWidth: number;
};
export const FINE_DEFAULT: GameLookFine = {
  scale: 100,
  spacing: 0,
  leading: 0,
  align: "",
  font: "",
  opacity: 100,
  bold: false,
  shadowX: 2,
  shadowY: 3,
  shadowBlur: 6,
  shadowAlpha: 0,
  glow: "",
  glowSize: 14,
  stroke: "",
  strokeWidth: 2,
};
export const FINE_ALIGNS = ["", "left", "center", "right"] as const;
export const FINE_FONTS = ["", "sans", "serif", "round", "mono"] as const;
export const FINE_FONT_LABEL: Record<GameLookFine["font"], string> = {
  "": "そのまま",
  sans: "ゴシック",
  serif: "明朝",
  round: "丸ゴ",
  mono: "等幅",
};
const FINE_FONT_STACK: Record<Exclude<GameLookFine["font"], "">, string> = {
  sans: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif',
  serif: '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif',
  round: '"Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans Mono CJK JP", monospace',
};

function fineNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(max, Math.max(min, value)) * 10) / 10
    : fallback;
}

/** 保存された値から、細かい調整を取り出す。 */
export function readFine(raw: Record<string, unknown>): GameLookFine {
  // 前の「影（ぼかし・くっきり）」の保存データも、数値の影に読み替える。
  const legacy = raw.shadow === "soft" ? { x: 0, y: 3, blur: 8, alpha: 45 } : raw.shadow === "hard" ? { x: 3, y: 3, blur: 0, alpha: 50 } : null;
  return {
    scale: fineNumber(raw.scale, 40, 300, FINE_DEFAULT.scale),
    spacing: fineNumber(raw.spacing, -10, 50, FINE_DEFAULT.spacing),
    leading: fineNumber(raw.leading, 0, 300, FINE_DEFAULT.leading),
    align: oneOf(raw.align, FINE_ALIGNS, ""),
    font: oneOf(raw.font, FINE_FONTS, ""),
    opacity: fineNumber(raw.opacity, 10, 100, FINE_DEFAULT.opacity),
    bold: raw.bold === true,
    shadowX: fineNumber(raw.shadowX, -20, 20, legacy?.x ?? FINE_DEFAULT.shadowX),
    shadowY: fineNumber(raw.shadowY, -20, 20, legacy?.y ?? FINE_DEFAULT.shadowY),
    shadowBlur: fineNumber(raw.shadowBlur, 0, 30, legacy?.blur ?? FINE_DEFAULT.shadowBlur),
    shadowAlpha: fineNumber(raw.shadowAlpha, 0, 100, legacy?.alpha ?? FINE_DEFAULT.shadowAlpha),
    glow: lookColor(raw.glow),
    glowSize: fineNumber(raw.glowSize, 2, 40, FINE_DEFAULT.glowSize),
    stroke: lookColor(raw.stroke),
    strokeWidth: fineNumber(raw.strokeWidth, 0.5, 8, FINE_DEFAULT.strokeWidth),
  };
}

/** はじめの値のままか（何も調整していないか）。 */
export function fineIsDefault(fine: Partial<GameLookFine> | null | undefined): boolean {
  if (!fine) return true;
  const f = { ...FINE_DEFAULT, ...fine };
  return (
    f.scale === FINE_DEFAULT.scale &&
    f.spacing === 0 &&
    f.leading === 0 &&
    !f.align &&
    !f.font &&
    f.opacity === 100 &&
    !f.bold &&
    f.shadowAlpha === 0 &&
    !f.glow &&
    !f.stroke
  );
}

/** 影・光彩・縁取りを、1つの text-shadow にまとめる（ワードの文字の効果のように重ねられる）。 */
export function fineTextShadow(fine: Partial<GameLookFine> | null | undefined): string | undefined {
  if (!fine) return undefined;
  const f = { ...FINE_DEFAULT, ...fine };
  const layers: string[] = [];
  if (f.stroke) {
    const w = f.strokeWidth;
    const d = Math.round(w * 0.72 * 10) / 10;
    for (const [x, y] of [[-w, 0], [w, 0], [0, -w], [0, w], [-d, -d], [d, -d], [-d, d], [d, d]]) {
      layers.push(`${x}px ${y}px 0 ${f.stroke}`);
    }
  }
  if (f.glow) {
    const g = f.glowSize;
    layers.push(`0 0 ${g * 0.4}px ${f.glow}`, `0 0 ${g}px ${f.glow}`, `0 0 ${g * 1.8}px ${f.glow}`);
  }
  if (f.shadowAlpha > 0) layers.push(`${f.shadowX}px ${f.shadowY}px ${f.shadowBlur}px rgba(0, 0, 0, ${f.shadowAlpha / 100})`);
  return layers.length > 0 ? layers.join(", ") : undefined;
}

/** 文字そのものに付ける style（足したテキスト用。上の部分の文字は、中の文字が自分で持つ値に負けないよう別に扱う）。 */
export function fineStyle(fine: Partial<GameLookFine> | null | undefined): Record<string, string | number | undefined> {
  const f = { ...FINE_DEFAULT, ...(fine ?? {}) };
  return {
    zoom: f.scale !== 100 ? f.scale / 100 : undefined,
    opacity: f.opacity !== 100 ? f.opacity / 100 : undefined,
    letterSpacing: f.spacing !== 0 ? `${f.spacing / 100}em` : undefined,
    lineHeight: f.leading ? f.leading / 100 : undefined,
    textAlign: f.align || undefined,
    fontFamily: f.font ? FINE_FONT_STACK[f.font] : undefined,
    fontWeight: f.bold ? 900 : undefined,
    textShadow: fineTextShadow(f),
  };
}

/** 足したテキスト。文字の色と背景は、カードに使える色から選ぶ（背景の空は「なし」）。 */
export type GameLookExtraText = GameLookFine & {
  id: string;
  text: string;
  color: string;
  bg: string;
};
export const DEFAULT_EXTRA_TEXT_COLOR = "#1d2a22";

function readExtraTexts(raw: unknown): GameLookExtraText[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, START_TEXT_MAX).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(row.id) ? row.id : `t${index + 1}`;
    const fine = readFine(row);
    // 前の「小・中・大」は、大きさ（%）に読み替える。
    if (row.scale === undefined) fine.scale = row.size === "s" ? 85 : row.size === "l" ? 143 : 100;
    return [
      {
        ...fine,
        id,
        text: typeof row.text === "string" ? row.text.slice(0, 120) : "",
        color: lookColor(row.color) || DEFAULT_EXTRA_TEXT_COLOR,
        bg: lookColor(row.bg),
      },
    ];
  });
}

/** 参加画面でドラッグして動かせる部品。足した図形は shape:<id>。 */
export const GAME_LOOK_MOVE_KEYS = ["icon", "kicker", "title", "desc", "meta"] as const;
export type GameLookMoveKey = (typeof GAME_LOOK_MOVE_KEYS)[number];
/** 参加の入力欄（form）と参加ボタン（button）、足した図形・画像も動かせる。 */
const LOOK_OFFSET_KEY = /^(icon|kicker|title|desc|meta|form|button|(shape|img|extra):[A-Za-z0-9_-]{1,40}|blk:\d{1,2}|pblk:[A-Za-z0-9_-]{1,40}\.\d{1,2})$/;

/** 色を変えられる文字の部品。 */
export const GAME_LOOK_TEXT_KEYS = ["kicker", "title", "desc", "meta"] as const;
export type GameLookTextKey = (typeof GAME_LOOK_TEXT_KEYS)[number];
export const GAME_LOOK_TEXT_LABEL: Record<GameLookTextKey, string> = {
  kicker: "ゲームの種類",
  title: "タイトル",
  desc: "説明文",
  meta: "問題数など",
};
/** 文字の色と、文字の後ろの色。空はもとの色（後ろは色なし）。 */
export type GameLookTextStyle = { color: string; bg: string } & GameLookFine;

/** 参加画面の上に出すアイコン。画像を選んだときは、そちらを優先する。 */
export const GAME_LOOK_ICONS = ["stamp", "quiz", "trophy", "flag", "map", "star", "camera", "gift", "book", "sparkles"] as const;
export type GameLookIcon = (typeof GAME_LOOK_ICONS)[number];

export const GAME_LOOK_ICON_LABEL: Record<GameLookIcon, string> = {
  stamp: "スタンプ",
  quiz: "はてな",
  trophy: "トロフィー",
  flag: "旗",
  map: "ピン",
  star: "星",
  camera: "カメラ",
  gift: "プレゼント",
  book: "本",
  sparkles: "キラキラ",
};

/** スタンプラリー以外の参加画面の見た目（アイコンと背景）。 */
export type GameLook = {
  icon: GameLookIcon;
  iconImageUrl: string;
  bgTheme: GameBgTheme;
  bgImageUrl: string;
  /** 背景の写真の暗さ。 */
  shade: (typeof START_LOOK_SHADES)[number];
  /** ドラッグで動かした位置（カードに対する %）。 */
  offsets: Record<string, StartOffset>;
  /** 文字の部品ごとの色。 */
  texts: Partial<Record<GameLookTextKey, GameLookTextStyle>>;
  /** 足した図形・ボタン。ほかの部品の上に重ねる。 */
  shapes: GameStartShape[];
  /** 足した画像・イラスト。ほかの部品の上に重ねる。 */
  images: GameStartImage[];
  /** 足したテキスト。ほかの部品の上に重ねる。 */
  extraTexts: GameLookExtraText[];
  /**
   * プレイ中・クリアの画面の中身ごとの書式。
   * クリアは blk:<番号>（上から数えた順）、プレイ中は pblk:<部品の種類>.<その種類の何番目か>。
   */
  blocks: Record<string, GameLookTextStyle>;
  /** 足したものを出す画面。書いていないものは「参加」の画面（shape:<id> / img:<id> / extra:<id>）。 */
  screens: Record<string, "play" | "clear">;
};

/** 見た目を編集できる画面。 */
export type GameLookScreen = "start" | "play" | "clear";

export const DEFAULT_GAME_LOOK: GameLook = {
  icon: "stamp",
  iconImageUrl: "",
  bgTheme: "",
  bgImageUrl: "",
  shade: "light",
  offsets: {},
  texts: {},
  shapes: [],
  images: [],
  extraTexts: [],
  screens: {},
  blocks: {},
};

/** 色は #rrggbb だけ通す（ワードのように自由に選べる）。 */
function lookColor(value: unknown): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "";
}

function readTextStyles(raw: unknown): GameLook["texts"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GameLook["texts"] = {};
  for (const key of GAME_LOOK_TEXT_KEYS) {
    const row = (raw as Record<string, unknown>)[key];
    if (!row || typeof row !== "object") continue;
    const color = lookColor((row as Record<string, unknown>).color);
    const bg = lookColor((row as Record<string, unknown>).bg);
    const fine = readFine(row as Record<string, unknown>);
    // 前の「小・大」は、大きさ（%）に読み替える。
    const oldSize = (row as Record<string, unknown>).size;
    if ((row as Record<string, unknown>).scale === undefined && (oldSize === "s" || oldSize === "l")) {
      fine.scale = oldSize === "s" ? 85 : 130;
    }
    if (color || bg || !fineIsDefault(fine)) out[key] = { color, bg, ...fine };
  }
  return out;
}

/** アプリに入っている絵（/ から始まる）か、http(s) の画像だけ通す。 */
function lookImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("..") && !raw.includes("\\")) {
    return raw.slice(0, 300);
  }
  return safeImageUrl(raw, 500);
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T): T {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function readGameLook(raw: unknown): GameLook {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_GAME_LOOK;
  const row = raw as Record<string, unknown>;
  return {
    icon: oneOf(row.icon, GAME_LOOK_ICONS, DEFAULT_GAME_LOOK.icon),
    iconImageUrl: lookImage(row.iconImageUrl),
    bgTheme: oneOf(row.bgTheme, BG_THEMES, ""),
    bgImageUrl: lookImage(row.bgImageUrl),
    shade: oneOf(row.shade, START_LOOK_SHADES, DEFAULT_GAME_LOOK.shade),
    offsets: sanitizeStartOffsets(row.offsets, LOOK_OFFSET_KEY, 60),
    texts: readTextStyles(row.texts),
    shapes: sanitizeStartShapes(row.shapes),
    images: sanitizeStartImages(row.images),
    extraTexts: readExtraTexts(row.extraTexts),
    screens: readScreens(row.screens),
    blocks: readBlockStyles(row.blocks),
  };
}

const BLOCK_KEY = /^(blk:\d{1,2}|pblk:[A-Za-z0-9_-]{1,40}\.\d{1,2})$/;

function readBlockStyles(raw: unknown): GameLook["blocks"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GameLook["blocks"] = {};
  for (const [key, row] of Object.entries(raw as Record<string, unknown>).slice(0, 40)) {
    if (!BLOCK_KEY.test(key) || !row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const color = lookColor(r.color);
    const bg = lookColor(r.bg);
    const fine = readFine(r);
    if (color || bg || !fineIsDefault(fine)) out[key] = { color, bg, ...fine };
  }
  return out;
}

function readScreens(raw: unknown): GameLook["screens"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GameLook["screens"] = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 40)) {
    if (/^(shape|img|extra):[A-Za-z0-9_-]{1,40}$/.test(key) && (value === "play" || value === "clear")) out[key] = value;
  }
  return out;
}

/** その画面に出す、足した図形・画像・テキストだけを残した見た目。 */
export function lookForScreen(look: GameLook | null | undefined, screen: GameLookScreen): GameLook | null {
  if (!look) return null;
  const on = (key: string) => (look.screens?.[key] ?? "start") === screen;
  return {
    ...look,
    shapes: look.shapes.filter((item) => on(`shape:${item.id}`)),
    images: look.images.filter((item) => on(`img:${item.id}`)),
    extraTexts: (look.extraTexts ?? []).filter((item) => on(`extra:${item.id}`)),
  };
}

/** 背景を変えているか（色か写真）。 */
export function gameLookHasBg(look: GameLook | null | undefined): boolean {
  return Boolean(look && (look.bgTheme || look.bgImageUrl));
}
