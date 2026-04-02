import { redirect } from "next/navigation";

/** 旧URL。料金プランは /organizer/settings/plan へ統合しました。 */
export default function OrganizerSettingsBillingRedirectPage() {
  redirect("/organizer/settings/plan");
}
