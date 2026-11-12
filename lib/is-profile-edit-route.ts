/** プロフィール編集（フルスクリーンに近いモバイル UI） */
export function isProfileEditRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // 主催者モードのプロフィール（/organizer/settings/profile）も同じ編集画面
  return (
    pathname === "/profile/edit" ||
    pathname.startsWith("/profile/edit/") ||
    pathname === "/organizer/settings/profile"
  );
}
