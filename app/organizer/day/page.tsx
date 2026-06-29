import { redirect } from "next/navigation";

/** 旧URL — ダッシュボードへ統合 */
export default function OrganizerDayRedirectPage() {
  redirect("/organizer");
}
