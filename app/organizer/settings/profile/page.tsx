import ProfileEditPage from "@/app/profile/edit/page";

/**
 * 主催者モードのプロフィール（団体名・アイコン・カバー・紹介など）。
 * 中身は /profile/edit と同じ部品で、URL で主催者のプロフィールだけを出す。
 * 主催者の画面の main には周りに余白があるので、端まで広げる。
 */
export default function OrganizerProfileSettingsPage() {
  return (
    <div className="-mx-4 -mt-2 -mb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:-mx-6 sm:-mt-3 min-[900px]:-mx-6 min-[900px]:-my-2.5">
      <ProfileEditPage />
    </div>
  );
}
