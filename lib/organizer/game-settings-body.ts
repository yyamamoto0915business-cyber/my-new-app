import { sanitizeGameExperience } from "@/lib/organizer/game-experience";
import { readGameLook } from "@/lib/organizer/game-look";
import { sanitizeCheckinSettings } from "@/lib/organizer/checkin";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import { sanitizeCouponSettings } from "@/lib/organizer/coupon";
import { sanitizeMissionSettings } from "@/lib/organizer/mission";
import { sanitizePhotoSettings } from "@/lib/organizer/photo";
import { readGamePassSettings } from "@/lib/organizer/game-pass";
import { sanitizeVoteSettings } from "@/lib/organizer/vote";
import { sanitizeLotterySettings } from "@/lib/organizer/lottery";
import { sanitizeSurveySettings } from "@/lib/organizer/survey";

export type GameSettingsBody = {
  quiz?: unknown;
  mission?: unknown;
  photo?: unknown;
  coupon?: unknown;
  checkin?: unknown;
  mystery?: unknown;
  vote?: unknown;
  lottery?: unknown;
  survey?: unknown;
  experience?: unknown;
  look?: unknown;
  audience?: unknown;
  participation?: unknown;
  playLimit?: unknown;
  pass?: unknown;
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
  // 投票はお題があるときだけ残す
  const voteRaw = body.vote && typeof body.vote === "object" ? sanitizeVoteSettings(body.vote) : null;
  const vote = voteRaw?.prompt ? voteRaw : null;
  // 抽選は賞が1つ以上あるときだけ残す
  const lotteryRaw = body.lottery && typeof body.lottery === "object" ? sanitizeLotterySettings(body.lottery) : null;
  const lottery = lotteryRaw && lotteryRaw.prizes.length > 0 ? lotteryRaw : null;
  // アンケートは質問が1つ以上あるときだけ残す
  const surveyRaw = body.survey && typeof body.survey === "object" ? sanitizeSurveySettings(body.survey) : null;
  const survey = surveyRaw && surveyRaw.questions.length > 0 ? surveyRaw : null;
  const experience = sanitizeGameExperience(body.experience);
  // 参加画面のアイコンと背景（スタンプラリー以外）。
  const look = body.look && typeof body.look === "object" ? readGameLook(body.look) : null;
  // 参加できる人（スタンプラリー以外）。誰でも以外のときだけ残す。
  const audience = body.audience === "entry" || body.audience === "event" || body.audience === "pass" ? body.audience : null;
  // 参加のしかた。どこからでも（参加コードで始める）のときだけ残す。
  const participation = body.participation === "remote" ? "remote" : null;
  // 遊べる回数（スタンプラリー以外）。何度でも（ログインなしで遊べる）のときだけ残す。
  const playLimit = body.playLimit === "repeat" ? "repeat" : null;
  // 参加パスの定員・締め切り・注意書き（申し込んだ人だけのとき）。
  // まちの情報のカードに出す画像（アプリ内の絵か、https の画像）。
  const cardRaw = typeof body.cardImage === "string" ? body.cardImage.trim() : "";
  const cardImage =
    (cardRaw.startsWith("/") && !cardRaw.startsWith("//") && !cardRaw.includes("..")) || /^https:\/\//.test(cardRaw)
      ? cardRaw.slice(0, 500)
      : null;
  // 参加パスの定員・締め切り・注意書き（申し込んだ人だけのとき。スタンプラリーは experience に参加できる人がある）。
  const pass =
    audience === "entry" || experience?.basics.audience === "entry" ? readGamePassSettings(body.pass) : null;
  if (!quiz && !mission && !photo && !coupon && !checkin && !mystery && !vote && !lottery && !survey && !experience && !look) return undefined;
  return {
    ...(quiz ? { quiz } : {}),
    ...(mission ? { mission } : {}),
    ...(photo ? { photo } : {}),
    ...(coupon ? { coupon } : {}),
    ...(checkin ? { checkin } : {}),
    ...(mystery ? { mystery } : {}),
    ...(vote ? { vote } : {}),
    ...(lottery ? { lottery } : {}),
    ...(survey ? { survey } : {}),
    ...(experience ? { experience } : {}),
    ...(look ? { look } : {}),
    ...(audience ? { audience } : {}),
    ...(participation ? { participation } : {}),
    ...(playLimit ? { playLimit } : {}),
    ...(pass ? { pass } : {}),
    ...(cardImage ? { cardImage } : {}),
  };
}
