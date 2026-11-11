/**
 * QRコードの読み取り画面（/checkin/scan）。
 * カメラを大きく使うので、スマホでは全体の上の帯・下のメニューを外して全画面にする。
 */
export function isCheckinScanRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/checkin/scan" || pathname.startsWith("/checkin/scan/");
}
