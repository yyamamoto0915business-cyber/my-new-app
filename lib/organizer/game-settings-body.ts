import { sanitizeGameExperience } from "@/lib/organizer/game-experience";
import { readGameLook } from "@/lib/organizer/game-look";
import { sanitizeCheckinSettings } from "@/lib/organizer/checkin";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import { sanitizeCouponSettings } from "@/lib/organizer/coupon";
import { sanitizeMissionSettings } from "@/lib/organizer/mission";
import { sanitizePhotoSettings } from "@/lib/organizer/photo";

export type GameSettingsBody = {
  quiz?: unknown;
  mission?: unknown;
  photo?: unknown;
  coupon?: unknown;
  checkin?: unknown;
  mystery?: unknown;
  experience?: unknown;
  look?: unknown;
  audience?: unknown;
  cardImage?: unknown;
};

/** 作成画面から届いた設定を、保存する形にそろえる。作成（POST）と上書き（PUT）で同じものを使う。 */
export function settingsFromBody(body: GameSettingsBody) {
  const quiz = body.quiz && typeof body.quiz === "object" ? body.quiz : null;
  const mission = sanitizeMissionSettings(body.mission);
  const photo = sanitizePhotoSettings(body.photo);
  const coupon = sanitizeCouponSettings(body.coupon);
  const checkin = sanitizeCheckinSettings(body.checkin);
  const mystery = sanitizeMysterySettings(body.mystery);
  const experience = sanitizeGameExperience(body.experience);
  // 参加画面のアイコンと背景（スタンプラリー以外）。
  const look = body.look && typeof body.look === "object" ? readGameLook(body.look) : null;
  // 参加できる人（スタンプラリー以外）。誰でも以外のときだけ残す。
  const audience = body.audience === "event" || body.audience === "pass" ? body.audience : null;
  // まちの情報のカードに出す画像（アプリ内の絵か、https の画像）。
  const cardRaw = typeof body.cardImage === "string" ? body.cardImage.trim() : "";
  const cardImage =
    (cardRaw.startsWith("/") && !cardRaw.startsWith("//") && !cardRaw.includes("..")) || /^https:\/\//.test(cardRaw)
      ? cardRaw.slice(0, 500)
      : null;
  if (!quiz && !mission && !photo && !coupon && !checkin && !mystery && !experience && !look) return undefined;
  return {
    ...(quiz ? { quiz } : {}),
    ...(mission ? { mission } : {}),
    ...(photo ? { photo } : {}),
    ...(coupon ? { coupon } : {}),
    ...(checkin ? { checkin } : {}),
    ...(mystery ? { mystery } : {}),
    ...(experience ? { experience } : {}),
    ...(look ? { look } : {}),
    ...(audience ? { audience } : {}),
    ...(cardImage ? { cardImage } : {}),
  };
}
