import { redirect } from "next/navigation";
import { ORGANIZER_MOBILE_HOME_HREF } from "@/lib/organizer/organizer-nav";

/**
 * 旧「運営」タブ。中身（当日の運営・レジ・ゲーム・イベント管理）がホームと重なっていたので、
 * 道具はホームの「よく使う」にまとめ、下のナビの4つ目は主催者のチャットにした。
 */
export default function OrganizerToolsRedirectPage() {
  redirect(ORGANIZER_MOBILE_HOME_HREF);
}
