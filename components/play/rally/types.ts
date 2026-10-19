import type { GameHowtoIcon } from "@/lib/organizer/game-experience";

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
  periodLabel: string | null;
};

/** スタンプを押した直後の演出に渡す一件。 */
export type RallyStampEvent = {
  spotId: string | null;
  name: string;
  already: boolean;
};

export type RallyTab = "home" | "map" | "scan" | "reward" | "me";
