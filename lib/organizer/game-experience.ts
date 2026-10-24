/**
 * 参加者が見るゲーム体験。スタンプラリー作成で使い、
 * クイズやミッションからも同じ形を参照できる。
 * organizer_games.settings.experience に保存する。
 */

export const GAME_EXPERIENCE_CATEGORIES = [
  "商店街",
  "観光",
  "お祭り",
  "グルメ",
  "歴史・文化",
  "農業・食育",
  "防災",
  "子ども向け",
] as const;

export const GAME_AUDIENCES = ["anyone", "event", "pass"] as const;
export const GAME_PLAY_LIMITS = ["once", "repeat"] as const;
export const GAME_ROUTES = ["free", "ordered", "any-start"] as const;
export const GAME_CHECKIN_METHODS = ["qr", "gps", "keyword"] as const;
export const GAME_HOWTO_ICONS = ["pin", "qr", "stamp", "gift", "flag"] as const;
export const GAME_STAMP_ANIMATIONS = ["pop", "sparkle", "confetti", "bounce", "none"] as const;
export const GAME_STAMP_SOUNDS = ["none", "pop", "chime"] as const;
export const GAME_SCREEN_IDS = ["start", "spot", "stamp", "clear"] as const;

/** スタート画面の見た目。位置や色は候補から選ぶので、どの機種でも崩れない。 */
export const START_LOOK_POSITIONS = ["top", "middle", "bottom"] as const;
export const START_LOOK_ALIGNS = ["left", "center"] as const;
export const START_LOOK_SIZES = ["s", "m", "l"] as const;
export const START_LOOK_TEXT_COLORS = ["#ffffff", "#fff4d6", "#1d2a22"] as const;
export const START_LOOK_BUTTON_COLORS = ["#1f7a4a", "#d9452b", "#f08a24", "#2f7cf6", "#8b5cf6", "#1d2a22"] as const;
export const START_LOOK_SHADES = ["none", "light", "strong"] as const;
export type GameStartLook = {
  position: (typeof START_LOOK_POSITIONS)[number];
  align: (typeof START_LOOK_ALIGNS)[number];
  size: (typeof START_LOOK_SIZES)[number];
  textColor: (typeof START_LOOK_TEXT_COLORS)[number];
  buttonColor: (typeof START_LOOK_BUTTON_COLORS)[number];
  shade: (typeof START_LOOK_SHADES)[number];
  /**
   * ドラッグで動かしたぶんのずれ。画面の幅・高さに対する割合（%）で持ち、機種が違っても同じ見え方に近づける。
   * キーは mascot / catch / title / desc / info / button / extra:<id>。
   */
  offsets?: Record<string, StartOffset>;
  /** × で消した、もとからある部品（catch / desc / info）。 */
  hidden?: string[];
  /** 背景の色のテーマ（背景の画像がないとき）。 */
  bgTheme?: GameBgTheme;
};
export type StartOffset = { x: number; y: number };
export const START_OFFSET_KEY = /^(mascot|catch|title|desc|info|button|(extra|img|shape):[A-Za-z0-9_-]{1,40})$/;

/** 主催者が足せる図形とボタン。 */
export const START_SHAPE_MAX = 8;
export const START_SHAPE_KINDS = ["rect", "rounded", "circle", "triangle", "star", "heart", "arrow", "button"] as const;
export type GameShapeKind = (typeof START_SHAPE_KINDS)[number];
export const START_SHAPE_LABEL: Record<GameShapeKind, string> = {
  rect: "四角",
  rounded: "角丸",
  circle: "丸",
  triangle: "三角",
  star: "星",
  heart: "ハート",
  arrow: "矢印",
  button: "ボタン",
};
export const START_SHAPE_COLORS = [
  "#ffffff",
  "#fff4d6",
  "#1d2a22",
  "#1f7a4a",
  "#d9452b",
  "#f08a24",
  "#f2b233",
  "#2f7cf6",
  "#8b5cf6",
  "#ec5f8c",
] as const;
export type GameStartShape = {
  id: string;
  kind: GameShapeKind;
  color: (typeof START_SHAPE_COLORS)[number];
  /** 幅（画面の幅に対する %）。 */
  width: number;
  /** 透明度（%）。 */
  opacity: number;
  /** ボタンの文字。 */
  label: string;
  /** ボタンを押したときに開くページ（https のみ）。 */
  href: string;
};
export const START_SHAPE_DEFAULT_WIDTH: Record<GameShapeKind, number> = {
  rect: 50,
  rounded: 50,
  circle: 30,
  triangle: 30,
  star: 30,
  heart: 30,
  arrow: 30,
  button: 60,
};

function safeLinkUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim().slice(0, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function sanitizeStartShapes(raw: unknown): GameStartShape[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, START_SHAPE_MAX).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const kind = oneOf(row.kind, START_SHAPE_KINDS, "rect");
    const id = typeof row.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(row.id) ? row.id : `s${index + 1}`;
    const width =
      typeof row.width === "number" && Number.isFinite(row.width)
        ? Math.round(Math.min(100, Math.max(5, row.width)) * 10) / 10
        : START_SHAPE_DEFAULT_WIDTH[kind];
    const opacity =
      typeof row.opacity === "number" && Number.isFinite(row.opacity)
        ? Math.round(Math.min(100, Math.max(10, row.opacity)))
        : 100;
    return [
      {
        id,
        kind,
        color: oneOf(row.color, START_SHAPE_COLORS, "#ffffff"),
        width,
        opacity,
        label: text(row.label, 30),
        href: safeLinkUrl(row.href),
      },
    ];
  });
}

/** スタート画面に足せる画像・イラスト。アップロードした写真か、アプリに入っているイラスト。 */
export const START_IMAGE_MAX = 6;
export const START_IMAGE_SIZES = ["s", "m", "l"] as const;
export type GameStartImage = {
  id: string;
  url: string;
  size: (typeof START_IMAGE_SIZES)[number];
  /** 丸く切り抜く（写真向け）。 */
  round: boolean;
  /** 指やつまみで大きさを変えたときの幅（画面の幅に対する %）。あれば size より優先。 */
  width?: number;
  /** 動画（url は動画のアドレス）。足した画像と同じように置いて、動かす・大きさを変える。 */
  video?: boolean;
};
export const START_VIDEO_MAX = 2;
export const START_IMAGE_WIDTH: Record<GameStartImage["size"], number> = { s: 22, m: 38, l: 62 };
export const START_IMAGE_MIN_WIDTH = 8;
export const START_IMAGE_MAX_WIDTH = 100;

/**
 * スタンプGET・クリア画面の、主催者が整えた配置。
 * offsets は決まった部品（帯・スタンプ・カードなど）のずれ、texts と images は足したもの。
 */
export type GameScreenLayout = {
  offsets: Record<string, StartOffset>;
  texts: GameStartText[];
  images: GameStartImage[];
  shapes: GameStartShape[];
  /** メッセージなどの文字の色。 */
  textColor: (typeof START_LOOK_TEXT_COLORS)[number];
  /** 背景の画像。空ならスタート画面の背景を使う。 */
  bgImageUrl: string;
  /** 背景の動画。あれば画像より優先して流す（画像は読み込むまでの表示）。 */
  bgVideoUrl: string;
  shade: (typeof START_LOOK_SHADES)[number];
  /** × で消した、もとからある部品。 */
  hidden: string[];
  /** カードの色。空はもとの色。 */
  card: GameCardColors;
  /** 背景の色のテーマ。 */
  bgTheme: GameBgTheme;
  /** 放射状の光の線を出すか。 */
  rays: boolean;
  /** 見出しなど、もとからある文字の書き換え（空はもとの文字）。 */
  labels: Record<string, string>;
  /** 見出しの色（空はもとの色）。 */
  titleColor: string;
};
/** ホーム画面で動かせる部品。 */
export const HOME_LAYOUT_KEYS = ["meter", "bookTitle", "book", "nextTitle", "next"] as const;
/** 書き換えられる見出し。 */
export const LAYOUT_LABEL_KEYS = ["meterLabel", "bookTitle", "nextTitle"] as const;
/** 背景の色のテーマ。空はもとの色（画面ごとに決まった色）。 */
export const BG_THEMES = ["", "brown", "green", "navy", "purple", "pink", "orange", "sky", "cream", "black"] as const;
export type GameBgTheme = (typeof BG_THEMES)[number];
export const BG_THEME_LABEL: Record<GameBgTheme, string> = {
  "": "もとの色",
  brown: "ブラウン",
  green: "グリーン",
  navy: "ネイビー",
  purple: "パープル",
  pink: "ピンク",
  orange: "オレンジ",
  sky: "そら",
  cream: "クリーム",
  black: "ブラック",
};
/** 見本の色（テーマの中心の色）。 */
export const BG_THEME_SWATCH: Record<Exclude<GameBgTheme, "">, string> = {
  brown: "radial-gradient(circle at 50% 30%, #8a3b1d, #24100a)",
  green: "radial-gradient(circle at 50% 30%, #2f8f5c, #0f3d26)",
  navy: "radial-gradient(circle at 50% 30%, #2d4f9e, #0d1838)",
  purple: "radial-gradient(circle at 50% 30%, #7a4bc9, #241046)",
  pink: "radial-gradient(circle at 50% 30%, #f28bb2, #8d2d55)",
  orange: "radial-gradient(circle at 50% 30%, #f6a04d, #8a3a10)",
  sky: "radial-gradient(circle at 50% 30%, #8fd3ff, #2a77c9)",
  cream: "radial-gradient(circle at 50% 30%, #fffaf0, #efd9ae)",
  black: "radial-gradient(circle at 50% 30%, #3a3a3a, #0b0b0b)",
};

export type GameCardColors = {
  bg: string;
  number: string;
  text: string;
  accent: string;
};
/** カードに使える色（空は「もとの色」）。 */
export const CARD_COLORS = [
  "#ffffff",
  "#fffaf0",
  "#fff4d6",
  "#eef7f1",
  "#e3edfe",
  "#fde7ef",
  "#1d2a22",
  "#1f7a4a",
  "#d9452b",
  "#f08a24",
  "#f2b233",
  "#2f7cf6",
  "#8b5cf6",
  "#ec5f8c",
] as const;
/** スタンプGET画面で動かせる部品。 */
export const STAMP_LAYOUT_KEYS = ["ribbon", "seal", "name", "msg", "card"] as const;
/** クリア画面で動かせる部品。 */
export const CLEAR_LAYOUT_KEYS = ["congrats", "ribbon", "trophy", "lead", "title", "msg", "card"] as const;
/** 消せない部品（画面を進めるボタンがあるため）。 */
export const LAYOUT_KEEP_KEYS = ["card", "book"] as const;
export const LAYOUT_PART_LABEL: Record<string, string> = {
  ribbon: "タイトルの帯",
  seal: "スタンプ",
  name: "スポット名",
  msg: "メッセージ",
  congrats: "「おめでとう！」",
  trophy: "トロフィー",
  lead: "「すべてのスタンプを集めました！」",
  title: "ゲーム名",
  catch: "キャッチコピー",
  desc: "説明文",
  info: "案内カード",
  mascot: "マスコット",
  meter: "スタンプ獲得状況",
  bookTitle: "「スタンプ帳」の見出し",
  nextTitle: "「次に行くおすすめスポット」の見出し",
  next: "次に行くおすすめスポット",
};

function sanitizeLabels(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const key of LAYOUT_LABEL_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 30);
  }
  return out;
}

function sanitizeCardColors(raw: unknown): GameCardColors {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const pick = (value: unknown) =>
    typeof value === "string" && (CARD_COLORS as readonly string[]).includes(value) ? value : "";
  return { bg: pick(row.bg), number: pick(row.number), text: pick(row.text), accent: pick(row.accent) };
}

export function createScreenLayout(): GameScreenLayout {
  return { offsets: {}, texts: [], images: [], shapes: [], textColor: "#ffffff", bgImageUrl: "", bgVideoUrl: "", shade: "light", hidden: [], card: { bg: "", number: "", text: "", accent: "" }, bgTheme: "", rays: true, labels: {}, titleColor: "" };
}

export function sanitizeScreenLayout(raw: unknown, keys: readonly string[]): GameScreenLayout {
  const row = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const pattern = new RegExp(`^(${keys.join("|")}|(extra|img|shape):[A-Za-z0-9_-]{1,40})$`);
  return {
    offsets: sanitizeStartOffsets(row.offsets, pattern),
    texts: sanitizeStartTexts(row.texts),
    images: sanitizeStartImages(row.images),
    shapes: sanitizeStartShapes(row.shapes),
    textColor: oneOf(row.textColor, START_LOOK_TEXT_COLORS, "#ffffff"),
    bgImageUrl: safeImageUrl(row.bgImageUrl),
    bgVideoUrl: safeImageUrl(row.bgVideoUrl),
    shade: oneOf(row.shade, START_LOOK_SHADES, "light"),
    card: sanitizeCardColors(row.card),
    bgTheme: oneOf(row.bgTheme, BG_THEMES, ""),
    rays: row.rays !== false,
    labels: sanitizeLabels(row.labels),
    titleColor:
      typeof row.titleColor === "string" && (CARD_COLORS as readonly string[]).includes(row.titleColor)
        ? row.titleColor
        : "",
    hidden: Array.isArray(row.hidden)
      ? [...new Set(row.hidden.filter((key): key is string => typeof key === "string" && keys.includes(key)))].filter(
          (key) => !(LAYOUT_KEEP_KEYS as readonly string[]).includes(key),
        )
      : [],
  };
}

/** アプリに入っている絵（/play/ と /organizer/games/ の下）だけ、相対パスのまま通す。 */
export function safeStartImageUrl(value: unknown): string {
  if (typeof value === "string" && /^\/(play|organizer\/games)\/[A-Za-z0-9_\-/]+\.(webp|png|jpe?g)$/.test(value)) {
    return value;
  }
  return safeImageUrl(value);
}
/** スタート画面に自由に足せるテキスト。位置は上のタイトルの下に、足した順に並ぶ。 */
export const START_TEXT_MAX = 5;
export type GameStartText = {
  id: string;
  text: string;
  size: (typeof START_LOOK_SIZES)[number];
  bold: boolean;
  color: (typeof START_LOOK_TEXT_COLORS)[number];
};
export const DEFAULT_START_LOOK: GameStartLook = {
  position: "top",
  align: "center",
  size: "m",
  textColor: "#ffffff",
  buttonColor: "#1f7a4a",
  shade: "light",
};
/** スポットの種類。参加者のマップの絞り込みと札の色に使う。 */
export const GAME_SPOT_CATEGORIES = [
  "food",
  "shop",
  "sightseeing",
  "culture",
  "event",
  "stamp",
  "stay",
  "nature",
  "sports",
  "transport",
] as const;
export type GameSpotCategory = (typeof GAME_SPOT_CATEGORIES)[number];
export const GAME_SPOT_CATEGORY_LABEL: Record<GameSpotCategory, string> = {
  food: "飲食店・カフェ",
  shop: "商店・ショッピング",
  sightseeing: "観光・名所",
  culture: "文化・施設",
  event: "イベント・お祭り",
  stamp: "スタンプスポット",
  stay: "宿泊施設",
  nature: "自然・レジャー",
  sports: "スポーツ・アクティビティ",
  transport: "交通・その他",
};

/** マップに置く建物の絵（public/play/spots/{id}.webp）。種類は絵から決まる。 */
export const GAME_SPOT_ICONS = {
  cafe: { label: "カフェ", category: "food" },
  restaurant: { label: "レストラン", category: "food" },
  ramen: { label: "ラーメン店", category: "food" },
  izakaya: { label: "居酒屋", category: "food" },
  bakery: { label: "ベーカリー", category: "food" },
  sweets: { label: "スイーツ店", category: "food" },
  greengrocer: { label: "八百屋", category: "shop" },
  drugstore: { label: "雑貨店・ドラッグストア", category: "shop" },
  shrine: { label: "神社", category: "sightseeing" },
  temple: { label: "お寺", category: "sightseeing" },
  castle: { label: "お城・城跡", category: "sightseeing" },
  historic: { label: "歴史的建造物", category: "sightseeing" },
  viewpoint: { label: "展望スポット", category: "sightseeing" },
  park: { label: "公園", category: "sightseeing" },
  museum: { label: "博物館・美術館", category: "culture" },
  community: { label: "文化施設・公民館", category: "culture" },
  "event-hall": { label: "イベント会場", category: "event" },
  market: { label: "マルシェ・市場", category: "event" },
  festival: { label: "お祭り会場", category: "event" },
  "kitchen-car": { label: "キッチンカー", category: "event" },
  plaza: { label: "広場・イベントスペース", category: "event" },
  stamp: { label: "スタンプラリースポット", category: "stamp" },
  hotel: { label: "ホテル", category: "stay" },
  ryokan: { label: "旅館", category: "stay" },
  lake: { label: "湖・池", category: "nature" },
  hiking: { label: "ハイキングコース", category: "nature" },
  playground: { label: "遊び場・子ども施設", category: "nature" },
  river: { label: "川・水辺", category: "nature" },
  sports: { label: "スポーツ施設", category: "sports" },
  cycle: { label: "レンタサイクル", category: "sports" },
  station: { label: "駅", category: "transport" },
  "bus-stop": { label: "バス停", category: "transport" },
} as const satisfies Record<string, { label: string; category: GameSpotCategory }>;
export type GameSpotIcon = keyof typeof GAME_SPOT_ICONS;
export const GAME_SPOT_ICON_IDS = Object.keys(GAME_SPOT_ICONS) as GameSpotIcon[];

/** 地図での見せ方。marker は種類のマーカー、art は建物の絵、photo は写真（mapImageUrl か、なければスポットの写真）。 */
export const GAME_SPOT_MAP_STYLES = ["marker", "art", "photo"] as const;
export type GameSpotMapStyle = (typeof GAME_SPOT_MAP_STYLES)[number];
export const GAME_SPOT_MAP_STYLE_LABEL: Record<GameSpotMapStyle, string> = {
  marker: "マーカー",
  art: "建物イラスト",
  photo: "写真・オリジナル画像",
};

export function spotIconCategory(icon: GameSpotIcon | undefined | null): GameSpotCategory {
  return icon && icon in GAME_SPOT_ICONS ? GAME_SPOT_ICONS[icon].category : "stamp";
}
export const GAME_REWARD_KINDS = ["name", "coupon", "points", "badge"] as const;
export type GameRewardKind = (typeof GAME_REWARD_KINDS)[number];

export const GAME_REWARD_KIND_LABEL: Record<GameRewardKind, string> = {
  name: "名前だけ",
  coupon: "クーポン",
  points: "ポイント",
  badge: "バッジ",
};
export const GAME_CHECKIN_RADIUS_PRESETS = [10, 30, 50, 100] as const;

export type GameAudience = (typeof GAME_AUDIENCES)[number];
export type GamePlayLimit = (typeof GAME_PLAY_LIMITS)[number];
export type GameRoute = (typeof GAME_ROUTES)[number];
export type GameCheckinMethod = (typeof GAME_CHECKIN_METHODS)[number];
export type GameHowtoIcon = (typeof GAME_HOWTO_ICONS)[number];
export type GameStampAnimation = (typeof GAME_STAMP_ANIMATIONS)[number];
export type GameStampSound = (typeof GAME_STAMP_SOUNDS)[number];
export type GameScreenId = (typeof GAME_SCREEN_IDS)[number];

export type GameHowtoStep = {
  icon: GameHowtoIcon;
  label: string;
};

export type GameExperienceSpot = {
  description: string;
  hint: string;
  imageUrl: string;
  videoUrl: string;
  required: boolean;
  published: boolean;
  checkin: GameCheckinMethod;
  radiusM: number;
  keyword: string;
  lat: number | null;
  lng: number | null;
  icon: GameSpotIcon;
  mapStyle: GameSpotMapStyle;
  /** 地図に出す画像。空ならスポットの写真を使う。 */
  mapImageUrl: string;
  /** このスポットで押されるスタンプの絵。空ならゲーム共通のスタンプ画像。 */
  stampImageUrl: string;
};

export type GameExperience = {
  basics: {
    category: string;
    tags: string;
    audience: GameAudience;
    playLimit: GamePlayLimit;
    route: GameRoute;
  };
  screens: {
    start: {
      title: string;
      catchCopy: string;
      description: string;
      imageUrl: string;
      videoUrl: string;
      steps: GameHowtoStep[];
      buttonLabel: string;
      showCharacter: boolean;
      showFreeBadge: boolean;
      showPeriod: boolean;
      showShare: boolean;
      look: GameStartLook;
      extraTexts: GameStartText[];
      extraImages: GameStartImage[];
      extraShapes: GameStartShape[];
    };
    spot: { intro: string };
    stamp: {
      message: string;
      animation: GameStampAnimation;
      imageUrl: string;
      sound: GameStampSound;
      soundUrl: string;
      layout: GameScreenLayout;
    };
    clear: { title: string; message: string; layout: GameScreenLayout };
    /** 参加中のホーム（スタンプ帳）。 */
    home: { layout: GameScreenLayout };
  };
  condition: { mode: "all" | "count"; requiredCount: number };
  reward: { kind: GameRewardKind; label: string; code: string; points: number; imageUrl: string };
  spots: GameExperienceSpot[];
};

export const GAME_AUDIENCE_LABEL: Record<GameAudience, string> = {
  anyone: "誰でも参加",
  event: "イベント参加者のみ",
  pass: "参加パス購入者のみ",
};

export const GAME_PLAY_LIMIT_LABEL: Record<GamePlayLimit, string> = {
  once: "1人1回",
  repeat: "何度でも参加可能",
};

export const GAME_ROUTE_LABEL: Record<GameRoute, string> = {
  free: "好きな順番",
  ordered: "指定された順番",
  "any-start": "どこからでもスタート",
};

export const GAME_CHECKIN_LABEL: Record<GameCheckinMethod, string> = {
  qr: "QRコード",
  gps: "GPS",
  keyword: "キーワード",
};

export const GAME_HOWTO_ICON_LABEL: Record<GameHowtoIcon, string> = {
  pin: "場所",
  qr: "QR",
  stamp: "スタンプ",
  gift: "特典",
  flag: "ゴール",
};

export const GAME_STAMP_ANIMATION_LABEL: Record<GameStampAnimation, string> = {
  pop: "ポンッと表示",
  sparkle: "キラキラ",
  confetti: "紙吹雪",
  bounce: "バウンス",
  none: "なし",
};

export const GAME_STAMP_SOUND_LABEL: Record<GameStampSound, string> = {
  none: "なし",
  pop: "ポン",
  chime: "チャイム",
};

export const GAME_SCREEN_LABEL: Record<GameScreenId, string> = {
  start: "スタート画面",
  spot: "スポット画面",
  stamp: "スタンプ獲得演出",
  clear: "クリア画面",
};

const DEFAULT_HOWTO: GameHowtoStep[] = [
  { icon: "pin", label: "スポットへ行く" },
  { icon: "qr", label: "QRを読み込む" },
  { icon: "stamp", label: "スタンプを集める" },
];

export function safeImageUrl(value: unknown, max = 500): string {
  const raw = text(value, max);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href.slice(0, max);
  } catch {
    return "";
  }
}

export function createExperienceSpot(): GameExperienceSpot {
  return {
    description: "",
    hint: "",
    imageUrl: "",
    videoUrl: "",
    required: true,
    published: true,
    checkin: "qr",
    radiusM: 30,
    keyword: "",
    lat: null,
    lng: null,
    icon: "stamp",
    mapStyle: "marker",
    mapImageUrl: "",
    stampImageUrl: "",
  };
}

export function createDefaultExperience(): GameExperience {
  return {
    basics: {
      category: "",
      tags: "",
      audience: "anyone",
      playLimit: "once",
      route: "free",
    },
    screens: {
      start: {
        title: "",
        catchCopy: "",
        description: "",
        imageUrl: "",
        videoUrl: "",
        steps: DEFAULT_HOWTO.map((step) => ({ ...step })),
        buttonLabel: "ラリーをはじめる",
        showCharacter: true,
        showFreeBadge: true,
        showPeriod: true,
        showShare: false,
        look: { ...DEFAULT_START_LOOK },
        extraTexts: [],
        extraImages: [],
        extraShapes: [],
      },
      spot: { intro: "" },
      stamp: {
        message: "",
        animation: "pop",
        imageUrl: "",
        sound: "pop",
        soundUrl: "",
        layout: createScreenLayout(),
      },
      clear: { title: "", message: "", layout: createScreenLayout() },
      home: { layout: createScreenLayout() },
    },
    condition: { mode: "all", requiredCount: 3 },
    reward: { kind: "name", label: "", code: "", points: 100, imageUrl: "" },
    spots: [],
  };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function clampRadius(value: unknown): number {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(500, Math.max(5, Math.round(raw)));
}

function coord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function sanitizePlace(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const latN = coord(lat);
  const lngN = coord(lng);
  if (latN == null || lngN == null) return null;
  if (latN < -90 || latN > 90 || lngN < -180 || lngN > 180) return null;
  return {
    lat: Math.round(latN * 1e6) / 1e6,
    lng: Math.round(lngN * 1e6) / 1e6,
  };
}

function sanitizeSpot(raw: unknown): GameExperienceSpot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const place = sanitizePlace(row.lat, row.lng);
  return {
    description: text(row.description, 200),
    hint: text(row.hint, 120),
    imageUrl: safeImageUrl(row.imageUrl),
    videoUrl: safeImageUrl(row.videoUrl),
    required: row.required !== false,
    published: row.published !== false,
    checkin: oneOf(row.checkin, GAME_CHECKIN_METHODS, "qr"),
    radiusM: clampRadius(row.radiusM),
    keyword: text(row.keyword, 40),
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    icon: oneOf(row.icon, GAME_SPOT_ICON_IDS, "stamp"),
    mapStyle: oneOf(row.mapStyle, GAME_SPOT_MAP_STYLES, "marker"),
    mapImageUrl: safeImageUrl(row.mapImageUrl),
    stampImageUrl: safeImageUrl(row.stampImageUrl),
  };
}

function sanitizeStartLook(raw: unknown): GameStartLook {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    position: oneOf(row.position, START_LOOK_POSITIONS, DEFAULT_START_LOOK.position),
    align: oneOf(row.align, START_LOOK_ALIGNS, DEFAULT_START_LOOK.align),
    size: oneOf(row.size, START_LOOK_SIZES, DEFAULT_START_LOOK.size),
    textColor: oneOf(row.textColor, START_LOOK_TEXT_COLORS, DEFAULT_START_LOOK.textColor),
    buttonColor: oneOf(row.buttonColor, START_LOOK_BUTTON_COLORS, DEFAULT_START_LOOK.buttonColor),
    shade: oneOf(row.shade, START_LOOK_SHADES, DEFAULT_START_LOOK.shade),
    offsets: sanitizeStartOffsets(row.offsets),
    hidden: Array.isArray(row.hidden)
      ? [...new Set(row.hidden.filter((key): key is string => key === "catch" || key === "desc" || key === "info"))]
      : [],
    bgTheme: oneOf(row.bgTheme, BG_THEMES, ""),
  };
}

export function sanitizeStartOffsets(
  raw: unknown,
  pattern: RegExp = START_OFFSET_KEY,
  max = 16,
): Record<string, StartOffset> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, StartOffset> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, max)) {
    if (!pattern.test(key) || !value || typeof value !== "object") continue;
    const { x, y } = value as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    const clamp = (n: number) => Math.round(Math.min(100, Math.max(-100, n)) * 10) / 10;
    if (clamp(x) === 0 && clamp(y) === 0) continue;
    out[key] = { x: clamp(x), y: clamp(y) };
  }
  return out;
}

export function sanitizeStartImages(raw: unknown): GameStartImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, START_IMAGE_MAX).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const video = row.video === true;
    const url = video ? safeImageUrl(row.url) : safeStartImageUrl(row.url);
    if (!url) return [];
    const id = typeof row.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(row.id) ? row.id : `i${index + 1}`;
    const width =
      typeof row.width === "number" && Number.isFinite(row.width)
        ? Math.round(Math.min(START_IMAGE_MAX_WIDTH, Math.max(START_IMAGE_MIN_WIDTH, row.width)) * 10) / 10
        : undefined;
    return [
      {
        id,
        url,
        size: oneOf(row.size, START_IMAGE_SIZES, "m"),
        round: row.round === true,
        ...(width ? { width } : {}),
        ...(video ? { video: true } : {}),
      },
    ];
  });
}

export function sanitizeStartTexts(raw: unknown): GameStartText[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, START_TEXT_MAX).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(row.id) ? row.id : `t${index + 1}`;
    return [
      {
        id,
        text: text(row.text, 120),
        size: oneOf(row.size, START_LOOK_SIZES, "m"),
        bold: row.bold === true,
        color: oneOf(row.color, START_LOOK_TEXT_COLORS, DEFAULT_START_LOOK.textColor),
      },
    ];
  });
}

function sanitizeHowto(raw: unknown): GameHowtoStep[] {
  if (!Array.isArray(raw)) return DEFAULT_HOWTO.map((step) => ({ ...step }));
  return raw.slice(0, 5).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = text(row.label, 24);
    if (!label) return [];
    return [{ icon: oneOf(row.icon, GAME_HOWTO_ICONS, "pin"), label }];
  });
}

/** 参加画面に出してよいスタート画面。キーワードや特典は含めない。 */
export type PublicPlayStart = {
  configured: boolean;
  title: string;
  catchCopy: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  steps: GameHowtoStep[];
  buttonLabel: string;
  showCharacter: boolean;
  showFreeBadge: boolean;
  showPeriod: boolean;
  showShare: boolean;
  look: GameStartLook;
  extraTexts: GameStartText[];
  extraImages: GameStartImage[];
  extraShapes: GameStartShape[];
};

/** 参加中に出してよい画面。正解キーワードそのものは含めない。 */
export type PublicPlayMoment = {
  configured: boolean;
  intro: string;
  description: string;
  hint: string;
  imageUrl: string;
  videoUrl: string;
  stampMessage: string;
  stampAnimation: GameStampAnimation;
  stampImageUrl: string;
  stampSound: GameStampSound;
  stampSoundUrl: string;
  clearTitle: string;
  clearMessage: string;
  rewardLabel: string;
  rewardKind: GameRewardKind;
  showCharacter: boolean;
  /** スタンプGET・クリア画面の配置。 */
  stampLayout: GameScreenLayout;
  clearLayout: GameScreenLayout;
  homeLayout: GameScreenLayout;
  /** keyword は言葉、gps はピンの半径内。どちらでもなければ QR。 */
  checkin: "qr" | "keyword" | "gps";
  lat: number | null;
  lng: number | null;
  radiusM: number | null;
};

export function rewardLine(kind: GameRewardKind, label: string): string {
  const name = label.trim();
  if (!name) return "";
  if (kind === "name") return `特典：${name}`;
  return `${GAME_REWARD_KIND_LABEL[kind]}：${name}`;
}

/** 付与ポイント。空や不正な値は100、範囲は1から9999。 */
export function rewardPointAmount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(9999, Math.max(1, Math.round(n)));
}

/** クリアしたポイント特典。加算前は数だけ、加算後は受け取り済み。 */
export function rallyPointsView(
  completed: boolean,
  reward: { kind: GameRewardKind; points: number } | null | undefined,
  awardedAt: string | null | undefined,
): { rewardPoints?: number; rewardPointsAwarded?: boolean } {
  if (!completed || reward?.kind !== "points") return {};
  const rewardPoints = rewardPointAmount(reward.points);
  return awardedAt ? { rewardPoints, rewardPointsAwarded: true } : { rewardPoints };
}

/** クリアしたクーポンだけ、使う前はコード、使ったあとは使用済み。 */
export function rallyCouponView(
  completed: boolean,
  reward: { kind: GameRewardKind; code: string } | null | undefined,
  usedAt: string | null | undefined,
): { rewardCode?: string; rewardUsed?: boolean } {
  if (!completed || reward?.kind !== "coupon") return {};
  if (usedAt) return { rewardUsed: true };
  const code = reward.code.trim();
  return code ? { rewardCode: code } : {};
}

/** クリアしたバッジ。ログイン前は名前だけ、受け取ったあとは受け取り済み。 */
export function rallyBadgeView(
  completed: boolean,
  reward: { kind: GameRewardKind; label: string; imageUrl?: string } | null | undefined,
  awardedAt: string | null | undefined,
): { rewardBadge?: string; rewardBadgeAwarded?: boolean; rewardBadgeImage?: string } {
  if (!completed || reward?.kind !== "badge") return {};
  const rewardBadge = reward.label.trim() || "バッジ";
  const rewardBadgeImage = "imageUrl" in reward ? safeImageUrl(reward.imageUrl) : "";
  return awardedAt
    ? { rewardBadge, rewardBadgeAwarded: true, rewardBadgeImage: rewardBadgeImage || undefined }
    : { rewardBadge, rewardBadgeImage: rewardBadgeImage || undefined };
}

export function normalizeRallyKeyword(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** 正解が空のときは不一致。全角・空白・大文字小文字の差は吸収する。 */
export function rallyKeywordMatches(expected: string, attempt: string): boolean {
  const answer = normalizeRallyKeyword(expected);
  if (!answer) return false;
  return normalizeRallyKeyword(attempt) === answer;
}

/** 2点間の距離（m）。 */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earth = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function approachMessage(distanceM: number, radiusM: number): string {
  const remain = Math.max(0, distanceM - radiusM);
  if (remain < 1000) {
    const rounded = Math.max(10, Math.ceil(remain / 10) * 10);
    return `もう少し近づいてください。あと約${rounded}mです。`;
  }
  const km = Math.round((remain / 1000) * 10) / 10;
  return `もう少し近づいてください。あと約${km}kmです。`;
}

/** 現在地が無いときは gps_required。半径の外は gps_far。 */
export function rallyGpsDecision(
  spot: { lat: number; lng: number; radiusM: number },
  here: { lat: number; lng: number } | null,
): { ok: true } | { ok: false; code: "gps_required" } | { ok: false; code: "gps_far"; message: string } {
  if (!here) return { ok: false, code: "gps_required" };
  const distance = distanceMeters(spot, here);
  if (distance <= spot.radiusM) return { ok: true };
  return { ok: false, code: "gps_far", message: approachMessage(distance, spot.radiusM) };
}

function publicCheckin(spot: GameExperienceSpot | undefined): PublicPlayMoment["checkin"] {
  if (!spot) return "qr";
  if (spot.checkin === "keyword" && spot.keyword.trim()) return "keyword";
  if (spot.checkin === "gps" && spot.lat != null && spot.lng != null) return "gps";
  return "qr";
}

export function publicPlayMoment(settings: unknown, spotIndex: number | null): PublicPlayMoment {
  const blank: PublicPlayMoment = {
    configured: false,
    intro: "",
    description: "",
    hint: "",
    imageUrl: "",
    videoUrl: "",
    stampMessage: "",
    stampAnimation: "none",
    stampImageUrl: "",
    stampSound: "none",
    stampSoundUrl: "",
    clearTitle: "",
    clearMessage: "",
    rewardLabel: "",
    rewardKind: "name",
    showCharacter: false,
    stampLayout: createScreenLayout(),
    clearLayout: createScreenLayout(),
    homeLayout: createScreenLayout(),
    checkin: "qr",
    lat: null,
    lng: null,
    radiusM: null,
  };
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return blank;
  const experience = sanitizeGameExperience((settings as { experience?: unknown }).experience);
  if (!experience) return blank;
  const spot =
    spotIndex != null && spotIndex >= 0 && spotIndex < experience.spots.length
      ? experience.spots[spotIndex]
      : undefined;
  return {
    configured: true,
    intro: experience.screens.spot.intro,
    description: spot?.description ?? "",
    hint: spot?.hint ?? "",
    imageUrl: spot?.imageUrl ?? "",
    videoUrl: spot?.videoUrl ?? "",
    stampMessage: experience.screens.stamp.message,
    stampAnimation: experience.screens.stamp.animation,
    stampImageUrl: experience.screens.stamp.imageUrl,
    stampSound: experience.screens.stamp.sound,
    stampSoundUrl: experience.screens.stamp.soundUrl,
    clearTitle: experience.screens.clear.title,
    clearMessage: experience.screens.clear.message,
    rewardLabel: experience.reward.label,
    rewardKind: experience.reward.kind,
    showCharacter: experience.screens.start.showCharacter,
    stampLayout: experience.screens.stamp.layout,
    clearLayout: experience.screens.clear.layout,
    homeLayout: experience.screens.home.layout,
    checkin: publicCheckin(spot),
    lat: spot?.lat ?? null,
    lng: spot?.lng ?? null,
    radiusM: publicCheckin(spot) === "gps" ? (spot?.radiusM ?? null) : null,
  };
}

export function readPublicPlayMoment(raw: unknown): PublicPlayMoment {
  const blank = publicPlayMoment(null, null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return blank;
  const row = raw as Record<string, unknown>;
  return {
    configured: row.configured === true,
    intro: text(row.intro, 200),
    description: text(row.description, 200),
    hint: text(row.hint, 120),
    imageUrl: safeImageUrl(row.imageUrl),
    videoUrl: safeImageUrl(row.videoUrl),
    stampMessage: text(row.stampMessage, 40),
    stampAnimation: oneOf(row.stampAnimation, GAME_STAMP_ANIMATIONS, "none"),
    stampImageUrl: safeImageUrl(row.stampImageUrl),
    stampSound: oneOf(row.stampSound, GAME_STAMP_SOUNDS, "none"),
    stampSoundUrl: safeImageUrl(row.stampSoundUrl),
    clearTitle: text(row.clearTitle, 40),
    clearMessage: text(row.clearMessage, 120),
    rewardLabel: text(row.rewardLabel, 40),
    rewardKind: oneOf(row.rewardKind, GAME_REWARD_KINDS, "name"),
    showCharacter: row.showCharacter === true,
    stampLayout: sanitizeScreenLayout(row.stampLayout, STAMP_LAYOUT_KEYS),
    clearLayout: sanitizeScreenLayout(row.clearLayout, CLEAR_LAYOUT_KEYS),
    homeLayout: sanitizeScreenLayout(row.homeLayout, HOME_LAYOUT_KEYS),
    checkin:
      row.checkin === "keyword"
        ? "keyword"
        : row.checkin === "gps" && sanitizePlace(row.lat, row.lng)
          ? "gps"
          : "qr",
    ...(sanitizePlace(row.lat, row.lng) ?? { lat: null, lng: null }),
    radiusM:
      row.checkin === "gps" && sanitizePlace(row.lat, row.lng)
        ? clampRadius(row.radiusM)
        : null,
  };
}

export function publicPlayStart(settings: unknown): PublicPlayStart {
  const blank: PublicPlayStart = {
    configured: false,
    title: "",
    catchCopy: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    steps: [],
    buttonLabel: "ラリーをはじめる",
    showCharacter: false,
    showFreeBadge: false,
    showPeriod: false,
    showShare: false,
    look: { ...DEFAULT_START_LOOK },
    extraTexts: [],
    extraImages: [],
    extraShapes: [],
  };
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return blank;
  const experience = sanitizeGameExperience((settings as { experience?: unknown }).experience);
  if (!experience) return blank;
  const start = experience.screens.start;
  return {
    configured: true,
    title: start.title,
    catchCopy: start.catchCopy,
    description: start.description,
    imageUrl: start.imageUrl,
    videoUrl: start.videoUrl,
    steps: start.steps,
    buttonLabel: start.buttonLabel || blank.buttonLabel,
    showCharacter: start.showCharacter,
    showFreeBadge: start.showFreeBadge,
    showPeriod: start.showPeriod,
    showShare: start.showShare,
    look: start.look,
    extraTexts: start.extraTexts,
    extraImages: start.extraImages,
    extraShapes: start.extraShapes,
  };
}

export function sanitizeGameExperience(raw: unknown): GameExperience | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const base = createDefaultExperience();
  const basics = body.basics && typeof body.basics === "object" ? (body.basics as Record<string, unknown>) : {};
  const screens = body.screens && typeof body.screens === "object" ? (body.screens as Record<string, unknown>) : {};
  const start = screens.start && typeof screens.start === "object" ? (screens.start as Record<string, unknown>) : {};
  const spot = screens.spot && typeof screens.spot === "object" ? (screens.spot as Record<string, unknown>) : {};
  const stamp = screens.stamp && typeof screens.stamp === "object" ? (screens.stamp as Record<string, unknown>) : {};
  const clear = screens.clear && typeof screens.clear === "object" ? (screens.clear as Record<string, unknown>) : {};
  const condition =
    body.condition && typeof body.condition === "object" ? (body.condition as Record<string, unknown>) : {};
  const reward = body.reward && typeof body.reward === "object" ? (body.reward as Record<string, unknown>) : {};
  const category = text(basics.category, 20);
  const requiredRaw = typeof condition.requiredCount === "number" ? condition.requiredCount : Number(condition.requiredCount);

  return {
    basics: {
      category: (GAME_EXPERIENCE_CATEGORIES as readonly string[]).includes(category) ? category : "",
      tags: text(basics.tags, 80),
      audience: oneOf(basics.audience, GAME_AUDIENCES, base.basics.audience),
      playLimit: oneOf(basics.playLimit, GAME_PLAY_LIMITS, base.basics.playLimit),
      route: oneOf(basics.route, GAME_ROUTES, base.basics.route),
    },
    screens: {
      start: {
        title: text(start.title, 40),
        catchCopy: text(start.catchCopy, 80),
        description: text(start.description, 200),
        imageUrl: safeImageUrl(start.imageUrl),
        videoUrl: safeImageUrl(start.videoUrl),
        steps: sanitizeHowto(start.steps),
        buttonLabel: text(start.buttonLabel, 20) || base.screens.start.buttonLabel,
        showCharacter: start.showCharacter !== false,
        showFreeBadge: start.showFreeBadge !== false,
        showPeriod: start.showPeriod !== false,
        showShare: start.showShare === true,
        look: sanitizeStartLook(start.look),
        extraTexts: sanitizeStartTexts(start.extraTexts),
        extraImages: sanitizeStartImages(start.extraImages),
        extraShapes: sanitizeStartShapes(start.extraShapes),
      },
      spot: { intro: text(spot.intro, 200) },
      stamp: {
        message: text(stamp.message, 40),
        animation: oneOf(stamp.animation, GAME_STAMP_ANIMATIONS, "pop"),
        imageUrl: safeImageUrl(stamp.imageUrl),
        sound: oneOf(stamp.sound, GAME_STAMP_SOUNDS, "pop"),
        soundUrl: safeImageUrl(stamp.soundUrl),
        layout: sanitizeScreenLayout(stamp.layout, STAMP_LAYOUT_KEYS),
      },
      clear: {
        title: text(clear.title, 40),
        message: text(clear.message, 120),
        layout: sanitizeScreenLayout(clear.layout, CLEAR_LAYOUT_KEYS),
      },
      home: {
        layout: sanitizeScreenLayout(
          screens.home && typeof screens.home === "object" ? (screens.home as Record<string, unknown>).layout : null,
          HOME_LAYOUT_KEYS,
        ),
      },
    },
    condition: {
      mode: condition.mode === "count" ? "count" : "all",
      requiredCount: Number.isFinite(requiredRaw) ? Math.min(20, Math.max(1, Math.round(requiredRaw))) : 3,
    },
    reward: {
      kind: oneOf(reward.kind, GAME_REWARD_KINDS, "name"),
      label: text(reward.label, 40),
      code: text(reward.code, 24),
      points: rewardPointAmount(reward.points),
      imageUrl: safeImageUrl(reward.imageUrl),
    },
    spots: Array.isArray(body.spots)
      ? body.spots.slice(0, 20).flatMap((item) => {
          const parsed = sanitizeSpot(item);
          return parsed ? [parsed] : [];
        })
      : [],
  };
}

export type ExperienceCheckItem = {
  id: string;
  label: string;
  done: boolean;
  /** 作成ウィザードのステップ（1 テンプレート、2 基本設定、3 スポット、4 画面・演出、5 達成条件・特典）。 */
  step: 2 | 3 | 4 | 5;
  screen?: GameScreenId;
};

function readExperience(settings: unknown): GameExperience | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  return sanitizeGameExperience((settings as { experience?: unknown }).experience);
}

/** スタンプラリーのクリア判定。任意スポットは「全スポット達成」に含めない。 */
/** クリア済みで、何度でも参加できるときだけ、もう一周できる。 */
export function rallyCanReplay(completed: boolean, playLimit: GamePlayLimit | null | undefined): boolean {
  return completed && playLimit === "repeat";
}

export function publicPlayAudience(settings: unknown): GameAudience {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return "anyone";
  const experience = sanitizeGameExperience((settings as { experience?: unknown }).experience);
  if (experience) return experience.basics.audience;
  // スタンプラリー以外のゲームは、設定の一番上の audience（イベント参加者・参加パス保有者）を見る。
  const audience = (settings as { audience?: unknown }).audience;
  return audience === "event" || audience === "pass" ? audience : "anyone";
}

const EVENT_MEMBER_STATUSES = new Set(["applied", "confirmed", "change_requested", "checked_in", "completed"]);

/** 参加パスを持っているか。来場者の支払いと、スタッフパスを同じ条件で見る。 */
export function eventPassHeld(input: {
  participantStatus: string | null;
  price: number;
  paymentMethod: string | null;
  orderStatus: string | null;
  volunteerAccepted: boolean;
}): boolean {
  if (input.volunteerAccepted) return true;
  const status = input.participantStatus;
  if (!status || status === "declined" || status === "change_requested") return false;
  if (input.orderStatus === "refunded") return false;
  if (input.price > 0) {
    const onsite = input.paymentMethod === "onsite" || input.paymentMethod === "both";
    const paid =
      input.orderStatus === "paid" ||
      status === "confirmed" ||
      status === "checked_in" ||
      status === "completed";
    if (!onsite && !paid) return false;
  }
  return true;
}

/** 誰でも以外は、ログインと対象イベントへの参加がいる。入れるときは null。 */
export function rallyAudienceDecision(input: {
  audience: GameAudience | null | undefined;
  signedIn: boolean;
  eventLinked: boolean;
  participant: boolean;
  passHeld: boolean;
}): { ok: true } | { ok: false; code: "audience_login" | "audience_closed"; error: string } {
  const audience = input.audience ?? "anyone";
  if (audience === "anyone") return { ok: true };
  if (!input.signedIn) {
    return {
      ok: false,
      code: "audience_login",
      error:
        audience === "pass"
          ? "参加パスを持っているアカウントでログインしてください"
          : "イベントに参加しているアカウントでログインしてください",
    };
  }
  if (!input.eventLinked) {
    return { ok: false, code: "audience_closed", error: "このラリーの対象イベントがまだ決まっていません" };
  }
  if (audience === "event" && !input.participant) {
    return { ok: false, code: "audience_closed", error: "このラリーは、対象イベントの参加者だけが入れます" };
  }
  if (audience === "pass" && !input.passHeld) {
    return { ok: false, code: "audience_closed", error: "このラリーは、参加パスを持っている人だけが入れます" };
  }
  return { ok: true };
}

export function isEventMemberStatus(status: string | null | undefined): boolean {
  return Boolean(status && EVENT_MEMBER_STATUSES.has(status));
}

export function stampRallyCompleted(
  spots: { stamped: boolean; required?: boolean }[],
  settings: unknown,
): boolean {
  if (spots.length === 0) return false;
  const stampedCount = spots.filter((spot) => spot.stamped).length;
  if (stampedCount <= 0) return false;
  const experience = readExperience(settings);
  if (!experience || experience.condition.mode !== "count") {
    const required = spots.filter((spot) => spot.required !== false);
    const gate = required.length > 0 ? required : spots;
    return gate.every((spot) => spot.stamped);
  }
  const need = Math.min(experience.condition.requiredCount, spots.length);
  return stampedCount >= need;
}

/** どこからでもスタートで、最初に押した場所の次に巡るスポット。まだ無ければ null。 */
export function anyStartNextId(
  spots: { id: string; stamped: boolean; stampedAt?: string | null }[],
): string | null {
  const stamped = spots.filter((spot) => spot.stamped);
  if (stamped.length === 0) return null;
  const start = [...stamped].sort((a, b) => (a.stampedAt ?? "").localeCompare(b.stampedAt ?? ""))[0];
  const startIndex = spots.findIndex((spot) => spot.id === start.id);
  if (startIndex < 0) return null;
  for (let step = 1; step <= spots.length; step += 1) {
    const spot = spots[(startIndex + step) % spots.length];
    if (!spot.stamped) return spot.id;
  }
  return null;
}

/** 1人1回はログインしたアカウントで1回。別のニックネームでは入れない。 */
export function rallyAccountJoinDecision(input: {
  playLimit: GamePlayLimit;
  signedIn: boolean;
  accountNickname: string | null;
  sameNickname: boolean;
}): { ok: true } | { ok: false; code: "account_login" | "account_taken"; error: string } {
  if (input.playLimit === "once" && !input.signedIn) {
    return {
      ok: false,
      code: "account_login",
      error: "1人1回のラリーは、ログインしたアカウントで参加してください",
    };
  }
  if (input.accountNickname && !input.sameNickname) {
    return {
      ok: false,
      code: "account_taken",
      error: `このアカウントは、ニックネーム「${input.accountNickname}」で参加しています。`,
    };
  }
  return { ok: true };
}

export function publicPlayLimit(settings: unknown): GamePlayLimit {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return "once";
  const experience = sanitizeGameExperience((settings as { experience?: unknown }).experience);
  return experience?.basics.playLimit ?? "once";
}

/** 指定順と、どこからでもスタートのとき、次のスポット以外を押そうとした理由。押してよいときは null。 */
export function orderedStampBlock(
  spots: { id: string; name: string; stamped: boolean; stampedAt?: string | null }[],
  targetId: string,
  route: GameRoute,
): string | null {
  if (route !== "ordered" && route !== "any-start") return null;
  const target = spots.find((spot) => spot.id === targetId);
  if (!target || target.stamped) return null;
  const nextId = route === "any-start" ? anyStartNextId(spots) : (spots.find((spot) => !spot.stamped)?.id ?? null);
  if (!nextId || nextId === targetId) return null;
  const next = spots.find((spot) => spot.id === nextId);
  return `先に「${next?.name ?? "前のスポット"}」を巡ってください`;
}

export function experienceChecklist(input: {
  name: string;
  spots: { checkin: GameCheckinMethod }[];
  experience: GameExperience;
}): ExperienceCheckItem[] {
  const { name, spots, experience } = input;
  const start = experience.screens.start;
  const startDone = Boolean(start.title || start.catchCopy || start.description);
  const clear = experience.screens.clear;
  return [
    { id: "basics", label: "基本情報", done: name.trim().length > 0, step: 2 },
    {
      id: "spots",
      label: spots.length > 0 ? `スポット${spots.length}件` : "スポット",
      done: spots.length > 0,
      step: 3,
    },
    {
      id: "checkin",
      label: "チェックイン方法",
      done: spots.length > 0,
      step: 3,
    },
    { id: "start", label: "スタート画面", done: startDone, step: 4, screen: "start" },
    {
      id: "stamp",
      label: "スタンプ演出",
      done: experience.screens.stamp.message.length > 0,
      step: 4,
      screen: "stamp",
    },
    {
      id: "clear",
      label: "クリア画面",
      done: Boolean(clear.title || clear.message),
      step: 4,
      screen: "clear",
    },
    {
      id: "condition",
      label: experience.condition.mode === "all" ? "全スポット達成" : `${experience.condition.requiredCount}スポット以上`,
      done: true,
      step: 5,
    },
    { id: "reward", label: "特典", done: experience.reward.label.length > 0, step: 5 },
  ];
}
