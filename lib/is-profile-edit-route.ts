/** プロフィール編集（フルスクリーンに近いモバイル UI） */
export function isProfileEditRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/profile/edit" || pathname.startsWith("/profile/edit/");
}
