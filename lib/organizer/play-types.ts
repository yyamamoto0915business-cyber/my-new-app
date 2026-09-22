import type { OrganizerGameSpotKind } from "@/lib/organizer/game-tokens";

export const PLAY_NICKNAME_MAX = 20;
export const PLAY_PASSPHRASE_MIN = 4;
export const PLAY_PASSPHRASE_MAX = 32;

export type PlaySpotProgress = {
  id: string;
  name: string;
  kind: OrganizerGameSpotKind;
  kindLabel: string;
  stamped: boolean;
};

export type PlayProgress = {
  nickname: string;
  stampedCount: number;
  spotCount: number;
  completed: boolean;
  spots: PlaySpotProgress[];
};

export type PlaySession = {
  deviceToken: string;
  progress: PlayProgress;
};

export type PlayStampResult = PlaySession & {
  spotId: string;
  spotName: string;
  alreadyStamped: boolean;
};
