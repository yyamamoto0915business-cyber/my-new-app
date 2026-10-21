import type {
  GameHowtoIcon,
  GameStartImage,
  GameStartLook,
  GameStartShape,
  GameStartText,
} from "@/lib/organizer/game-experience";

export type PlayStartStep = {
  icon: GameHowtoIcon;
  label: string;
};

export type PlayStart = {
  configured: boolean;
  title: string;
  catchCopy: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  steps: PlayStartStep[];
  buttonLabel: string;
  showCharacter: boolean;
  showFreeBadge: boolean;
  showPeriod: boolean;
  showShare: boolean;
  /** 位置・色など。古いデータにはない。 */
  look?: GameStartLook;
  /** 主催者が足したテキスト。古いデータにはない。 */
  extraTexts?: GameStartText[];
  /** 主催者が足した画像・イラスト。古いデータにはない。 */
  extraImages?: GameStartImage[];
  /** 主催者が足した図形・ボタン。古いデータにはない。 */
  extraShapes?: GameStartShape[];
  periodLabel: string | null;
};

/** スタンプを押した直後の演出に渡す一件。 */
export type RallyStampEvent = {
  spotId: string | null;
  name: string;
  already: boolean;
};

export type RallyTab = "home" | "map" | "scan" | "reward" | "me";
