import {
  createDefaultExperience,
  sanitizeGameExperience,
  type GameExperience,
  type GameExperienceSpot,
  type GameSpotIcon,
} from "@/lib/organizer/game-experience";
import type { OrganizerGameSpotKind } from "@/lib/organizer/game-tokens";

export type StampRallyTemplateSpot = Pick<GameExperienceSpot, "description" | "hint"> & {
  name: string;
  kind: OrganizerGameSpotKind;
  icon?: GameSpotIcon;
};

/** テンプレート選択のタブ。 */
export const STAMP_RALLY_TEMPLATE_GROUPS = [
  { id: "town", label: "まち・観光" },
  { id: "event", label: "イベント・グルメ" },
  { id: "learn", label: "学び・こども" },
] as const;
export type StampRallyTemplateGroup = (typeof STAMP_RALLY_TEMPLATE_GROUPS)[number]["id"];

/** スポット絵（public/play/spots）のどれをテンプレートの顔にするか、とスポットの種類。 */
const TEMPLATE_LOOK: Record<string, { group: StampRallyTemplateGroup; art: GameSpotIcon; icons: GameSpotIcon[] }> = {
  shopping: { group: "town", art: "greengrocer", icons: ["greengrocer", "drugstore", "cafe"] },
  sightseeing: { group: "town", art: "viewpoint", icons: ["viewpoint", "historic", "temple"] },
  history: { group: "town", art: "castle", icons: ["historic", "shrine", "museum"] },
  festival: { group: "event", art: "festival", icons: ["plaza", "festival", "event-hall"] },
  gourmet: { group: "event", art: "ramen", icons: ["ramen", "bakery", "izakaya"] },
  farm: { group: "learn", art: "market", icons: ["park", "market", "community"] },
  safety: { group: "learn", art: "community", icons: ["sports", "park", "community"] },
  kids: { group: "learn", art: "playground", icons: ["park", "playground", "plaza"] },
};

export type StampRallyTemplate = {
  id: string;
  group: StampRallyTemplateGroup;
  /** カードに出す絵（スポット絵の ID）。 */
  art: GameSpotIcon;
  name: string;
  blurb: string;
  gameName: string;
  description: string;
  experience: GameExperience;
  spots: StampRallyTemplateSpot[];
};

function rallyTemplate(input: {
  id: string;
  name: string;
  blurb: string;
  gameName: string;
  description: string;
  category: GameExperience["basics"]["category"];
  catchCopy: string;
  start: string;
  clearTitle: string;
  clearMessage: string;
  rewardLabel: string;
  spots: StampRallyTemplateSpot[];
}): StampRallyTemplate {
  const base = createDefaultExperience();
  const experience = sanitizeGameExperience({
    ...base,
    basics: { ...base.basics, category: input.category },
    screens: {
      ...base.screens,
      start: {
        ...base.screens.start,
        title: input.gameName,
        catchCopy: input.catchCopy,
        description: input.start,
      },
      clear: { title: input.clearTitle, message: input.clearMessage },
    },
    reward: { ...base.reward, kind: "name", label: input.rewardLabel },
    spots: input.spots.map((spot, index) => ({
      description: spot.description,
      hint: spot.hint,
      icon: TEMPLATE_LOOK[input.id]?.icons[index] ?? "stamp",
    })),
  });
  if (!experience) throw new Error(input.id);
  const look = TEMPLATE_LOOK[input.id] ?? { group: "town" as const, art: "stamp" as const, icons: [] };
  return {
    id: input.id,
    group: look.group,
    art: look.art,
    name: input.name,
    blurb: input.blurb,
    gameName: input.gameName,
    description: input.description,
    experience,
    spots: input.spots.map((spot, index) => ({ ...spot, icon: look.icons[index] ?? "stamp" })),
  };
}

export const STAMP_RALLY_TEMPLATES: StampRallyTemplate[] = [
  rallyTemplate({
    id: "shopping",
    name: "商店街さんぽ",
    blurb: "店先を巡って、最後に特典",
    gameName: "商店街さんぽラリー",
    description: "まちの店を巡って、スタンプを集めます。",
    category: "商店街",
    catchCopy: "店先を歩いて、スタンプを集めよう",
    start: "気になるお店に寄って、スタンプを押してください。",
    clearTitle: "さんぽ完了",
    clearMessage: "お店を巡りきれました。特典を受け取ってください。",
    rewardLabel: "商店街の特典",
    spots: [
      { name: "一軒目", kind: "stamp", description: "最初のお店です。", hint: "看板を探してください" },
      { name: "二軒目", kind: "stamp", description: "次のお店です。", hint: "通りの奥です" },
      { name: "ゴールの店", kind: "goal", description: "ここで特典を受け取ります。", hint: "店員に声をかけてください" },
    ],
  }),
  rallyTemplate({
    id: "sightseeing",
    name: "観光めぐり",
    blurb: "景色のよい場所を巡る",
    gameName: "まちの観光ラリー",
    description: "景色のよい場所を巡るスタンプラリーです。",
    category: "観光",
    catchCopy: "まちの景色を、ゆっくり巡ろう",
    start: "案内に沿って、スポットへ向かってください。",
    clearTitle: "めぐり完了",
    clearMessage: "まちの景色を巡れました。",
    rewardLabel: "観光記念",
    spots: [
      { name: "眺めの場所", kind: "stamp", description: "まちを見渡せる場所です。", hint: "高台を目指してください" },
      { name: "古い通り", kind: "stamp", description: "昔からの通りです。", hint: "石畳を歩いてください" },
      { name: "見どころ", kind: "goal", description: "最後の見どころです。", hint: "案内板のそばです" },
    ],
  }),
  rallyTemplate({
    id: "festival",
    name: "おまつり",
    blurb: "祭りの会場を巡る",
    gameName: "おまつりラリー",
    description: "祭りの会場を巡って、スタンプを集めます。",
    category: "お祭り",
    catchCopy: "祭りの会場を、ひと回りしよう",
    start: "屋台や舞台のまわりを巡ってください。",
    clearTitle: "まつり完了",
    clearMessage: "会場をひと回りできました。",
    rewardLabel: "まつり記念",
    spots: [
      { name: "入口", kind: "stamp", description: "祭りの入口です。", hint: "のぼりを探してください" },
      { name: "舞台前", kind: "stamp", description: "演目を見られる場所です。", hint: "音のする方へ" },
      { name: "記念の場所", kind: "goal", description: "最後に寄る場所です。", hint: "本部のテントです" },
    ],
  }),
  rallyTemplate({
    id: "gourmet",
    name: "グルメ",
    blurb: "食べ歩きの店を巡る",
    gameName: "食べ歩きラリー",
    description: "まちの味を巡るスタンプラリーです。",
    category: "グルメ",
    catchCopy: "まちの味を、食べ歩こう",
    start: "気になる味のある店へ寄ってください。",
    clearTitle: "食べ歩き完了",
    clearMessage: "まちの味を巡れました。",
    rewardLabel: "食べ歩きの特典",
    spots: [
      { name: "一品目", kind: "stamp", description: "最初の味です。", hint: "香りを頼りに" },
      { name: "二品目", kind: "stamp", description: "次の味です。", hint: "角を曲がった先" },
      { name: "〆の店", kind: "goal", description: "最後の一店です。", hint: "赤い暖簾です" },
    ],
  }),
  rallyTemplate({
    id: "history",
    name: "歴史・文化",
    blurb: "旧跡や文化の場所を巡る",
    gameName: "歴史さんぽラリー",
    description: "旧跡や文化の場所を巡ります。",
    category: "歴史・文化",
    catchCopy: "まちの歴史を、歩いて知ろう",
    start: "案内板を読みながら、次の場所へ進んでください。",
    clearTitle: "さんぽ完了",
    clearMessage: "まちの歴史を巡れました。",
    rewardLabel: "歴史さんぽ記念",
    spots: [
      { name: "古い建物", kind: "stamp", description: "まちの古い建物です。", hint: "案内板を読んでください" },
      { name: "祠", kind: "stamp", description: "静かな場所です。", hint: "細い路地の先" },
      { name: "資料のある場所", kind: "goal", description: "最後に寄る場所です。", hint: "展示の入口です" },
    ],
  }),
  rallyTemplate({
    id: "farm",
    name: "農業・食育",
    blurb: "畑や食の場所を巡る",
    gameName: "食育ラリー",
    description: "食べものの育つ場所を巡ります。",
    category: "農業・食育",
    catchCopy: "食べものが育つ場所を見にいこう",
    start: "畑や直売の場所を巡ってください。",
    clearTitle: "めぐり完了",
    clearMessage: "食の場所を巡れました。",
    rewardLabel: "食育の特典",
    spots: [
      { name: "畑", kind: "stamp", description: "作物の育つ場所です。", hint: "緑の多い方へ" },
      { name: "直売", kind: "stamp", description: "採れたてがある場所です。", hint: "のぼりを探してください" },
      { name: "学ぶ場所", kind: "goal", description: "食について知る場所です。", hint: "看板のある建物" },
    ],
  }),
  rallyTemplate({
    id: "safety",
    name: "防災",
    blurb: "避難と備えの場所を巡る",
    gameName: "防災ラリー",
    description: "避難場所や備えの場所を確認します。",
    category: "防災",
    catchCopy: "いざという場所を、先に知っておこう",
    start: "案内に沿って、備えの場所を確認してください。",
    clearTitle: "確認完了",
    clearMessage: "備えの場所を確認できました。",
    rewardLabel: "防災の確認",
    spots: [
      { name: "避難場所", kind: "stamp", description: "集まる場所です。", hint: "防災の標識を探してください" },
      { name: "給水", kind: "stamp", description: "水を得る場所です。", hint: "公園の設備です" },
      { name: "備えの確認", kind: "goal", description: "最後の確認場所です。", hint: "役所か集会所です" },
    ],
  }),
  rallyTemplate({
    id: "kids",
    name: "子ども向け",
    blurb: "家族で巡れる短いコース",
    gameName: "こども探検ラリー",
    description: "家族で巡れる、短めのスタンプラリーです。",
    category: "子ども向け",
    catchCopy: "まちを探検して、スタンプを集めよう",
    start: "一緒に歩く人と、次の場所へ進んでください。",
    clearTitle: "探検完了",
    clearMessage: "まちの探検ができました。",
    rewardLabel: "探検のごほうび",
    spots: [
      { name: "スタートの木", kind: "stamp", description: "最初の目印です。", hint: "大きな木を探してください" },
      { name: "広場", kind: "stamp", description: "広い場所です。", hint: "遊具のそばです" },
      { name: "ゴール", kind: "goal", description: "探検の終わりです。", hint: "旗のある場所です" },
    ],
  }),
];
