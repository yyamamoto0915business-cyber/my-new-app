import type { OrganizerRole } from "@/lib/organizer/team";

/**
 * TEAM：主催者の画面ごとに、開くのに必要な役割。データベースのルール（00131）と同じ線を、画面の入口でも引く。
 * - スタッフ：当日の受付・レジ・一覧・マイページ（見るだけ）
 * - 編集者以上：掲載・ゲーム・募集の作成と編集、ダッシュボード、プロフィール、ポイントの設定
 * - 管理者以上：招待リンク
 * - オーナーだけ：売上の受け取り・支払い・チャット（チャットはデータベースでも本人だけ）
 */
const RULES: { re: RegExp; role: OrganizerRole }[] = [
  { re: /^\/organizer\/(settings\/(payouts|billing))(\/|$)/, role: "owner" },
  { re: /^\/organizer\/(messages|inbox)(\/|$)/, role: "owner" },
  { re: /^\/organizer\/team\/invite(\/|$)/, role: "admin" },
  { re: /^\/organizer\/new(\/|$)/, role: "editor" },
  { re: /^\/organizer\/[^/]+\/new(\/|$)/, role: "editor" },
  { re: /^\/organizer\/dashboard(\/|$)/, role: "editor" },
  { re: /^\/organizer\/settings\/profile(\/|$)/, role: "editor" },
  { re: /^\/organizer\/(articles|stories)(\/|$)/, role: "editor" },
  { re: /^\/organizer\/games\/analytics(\/|$)/, role: "editor" },
  { re: /^\/organizer\/games\/[^/]+\/analytics(\/|$)/, role: "editor" },
  { re: /^\/organizer\/events\/[^/]+\/(points|sponsors|answers|ticket-sales)(\/|$)/, role: "editor" },
  // 編集の画面（/organizer/events/<id> など）。当日の画面（…/day・…/day-of）と印刷はスタッフも開ける
  { re: /^\/organizer\/(events|stores|kitchen-cars|recruitments|games)\/[^/]+\/?$/, role: "editor" },
];

export function requiredRoleForPath(path: string): OrganizerRole {
  for (const r of RULES) if (r.re.test(path)) return r.role;
  return "staff";
}
