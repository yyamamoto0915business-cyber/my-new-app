import { redirect } from "next/navigation";

/**
 * ゲームの一覧は「掲載管理」のゲーム、作るのは「新しく掲載」にまとめた（スマホ・PC 共通）。
 * 古いリンクのために、このページは掲載管理のゲームへ移す。
 */
export default function OrganizerGamesPage() {
  redirect("/organizer/listings?kind=game");
}
