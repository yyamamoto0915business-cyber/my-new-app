import { Camera, HelpCircle, MapPin, Trophy, type LucideIcon } from "lucide-react";
import type { OrganizerGameTypeId } from "@/lib/organizer/game-types";

export type GamePurposeId = "walk" | "answer" | "collect" | "decide";

/** ゲームを作るときの「やりたいこと」。押すとそのまま作成に入り、遊び方（種類）は基本の手順で選ぶ。 */
export const GAME_PURPOSES: {
  id: GamePurposeId;
  label: string;
  sub: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  /** 先頭が、カードを押したときに選ばれている遊び方 */
  types: OrganizerGameTypeId[];
}[] = [
  { id: "walk", label: "まちを回ってもらう", sub: "スタンプ・チェックイン・クーポン", Icon: MapPin, color: "#2f7d4e", bg: "#e6f3ea", types: ["stamp", "checkin", "photo", "coupon", "mission"] },
  { id: "answer", label: "問題に答えてもらう", sub: "クイズラリー・謎解き", Icon: HelpCircle, color: "#a26a10", bg: "#fdf3dc", types: ["quiz", "mystery"] },
  { id: "collect", label: "集める・聞く", sub: "写真・アンケート", Icon: Camera, color: "#2f6fae", bg: "#e6f1fa", types: ["photo", "survey"] },
  { id: "decide", label: "みんなで決める", sub: "投票・抽選・トーナメント表", Icon: Trophy, color: "#6a4fb0", bg: "#efeaf9", types: ["vote", "lottery", "tournament"] },
];

/** 遊び方の小さな絵（専用の絵がない種類は共通のマスコット） */
export const GAME_TYPE_MASCOT: Partial<Record<OrganizerGameTypeId, string>> = {
  stamp: "/organizer/games/hub-mascot-stamp.png",
  quiz: "/organizer/games/hub-mascot-quiz.png",
  mystery: "/organizer/games/hub-mascot-mystery.png",
  mission: "/organizer/games/hub-mascot-mission.png",
  photo: "/organizer/games/hub-mascot-photo.png",
  coupon: "/organizer/games/hub-mascot-coupon.png",
  checkin: "/organizer/games/game-type-checkin.png?v=hub4",
};

export function isGamePurposeId(value: string | null): value is GamePurposeId {
  return value === "walk" || value === "answer" || value === "collect" || value === "decide";
}

// 遊び方を変えるとき、基本の手順で入れたゲーム名と説明を次の画面へ持ちこす
const CARRY_KEY = "mg-game-create-carry";
let live: { name: string; description: string } = { name: "", description: "" };

export function setLiveGameBasics(name: string, description: string) {
  live = { name, description };
}

export function stashGameBasicsForSwitch() {
  try {
    if (live.name.trim() || live.description.trim()) sessionStorage.setItem(CARRY_KEY, JSON.stringify(live));
  } catch {
    /* noop */
  }
}

export function takeCarriedGameBasics(): { name: string; description: string } | null {
  try {
    const raw = sessionStorage.getItem(CARRY_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CARRY_KEY);
    const v = JSON.parse(raw) as { name?: unknown; description?: unknown };
    return { name: typeof v.name === "string" ? v.name : "", description: typeof v.description === "string" ? v.description : "" };
  } catch {
    return null;
  }
}
