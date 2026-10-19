import type { OrganizerGameSpotKind } from "@/lib/organizer/game-tokens";
import type { GameSpotIcon, GameSpotMapStyle } from "@/lib/organizer/game-experience";

export const PLAY_NICKNAME_MAX = 20;
export const PLAY_PASSPHRASE_MIN = 4;
export const PLAY_PASSPHRASE_MAX = 32;

export type PlaySpotProgress = {
  id: string;
  name: string;
  kind: OrganizerGameSpotKind;
  kindLabel: string;
  stamped: boolean;
  imageUrl?: string;
  /** スポット詳細とマップに出す紹介。正解キーワードやQRの鍵は含めない。 */
  description?: string;
  hint?: string;
  checkin?: "qr" | "keyword" | "gps";
  lat?: number | null;
  lng?: number | null;
  videoUrl?: string;
  /** マップに置く建物の絵。種類（絞り込み）はこの絵から決まる。 */
  icon?: GameSpotIcon;
  /** 地図での見せ方。未設定はマーカー。 */
  mapStyle?: GameSpotMapStyle;
  mapImageUrl?: string;
};

export type PlayProgress = {
  nickname: string;
  stampedCount: number;
  spotCount: number;
  completed: boolean;
  /** 指定された順番のラリー。つぎのマスだけ押せる。 */
  ordered?: boolean;
  /** クリアしたクーポンの、店先で見せるコード。使用済みのあとは渡さない。 */
  rewardCode?: string;
  /** 店でクーポンを使ったあとのクリア画面。 */
  rewardUsed?: boolean;
  /** クリアしたポイント特典の数。 */
  rewardPoints?: number;
  /** ログイン中のアカウントへ加算済み。 */
  rewardPointsAwarded?: boolean;
  /** クリアしたバッジの名前。 */
  rewardBadge?: string;
  /** ログイン中のアカウントへ付与済み。 */
  rewardBadgeAwarded?: boolean;
  /** クイズを先にクリアした人から数えた順位。 */
  quizRank?: number;
  /** バッジの絵。 */
  rewardBadgeImage?: string;
  /** どこからでもスタートで、次に巡るスポット。未設定なら順番の先頭。 */
  nextSpotId?: string | null;
  /** スタンプカードに押す絵。 */
  stampImageUrl?: string;
  /** 何度でも参加できるラリーを、クリア後にもう一周できる。 */
  canReplay?: boolean;
  /** クイズで正解した問題。 */
  quiz?: {
    needed: number;
    solved: number[];
    rewards: string[];
  };
  /** ミッションで達成した課題。 */
  mission?: {
    needed: number;
    done: number[];
    rewards: string[];
  };
  /** フォトラリーで記録したスポット。 */
  photo?: {
    needed: number;
    done: number[];
    rewards: string[];
  };
  /** クーポンラリーで寄った店。 */
  coupon?: {
    needed: number;
    done: number[];
    autoGrant: boolean;
    noStack: boolean;
  };
  /** チェックインで記録した場所。 */
  checkin?: {
    needed: number;
    done: number[];
    rewards: string[];
  };
  /** 謎解きで解けた問題。 */
  mystery?: {
    needed: number;
    solved: number[];
    rewards: string[];
  };
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
