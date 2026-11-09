/**
 * イベントの作成・編集画面（スマホでは全体の上の帯・下のメニュー・主催者のメニューを外し、入力に集中できるようにする）
 * /organizer/events/new と /organizer/events/{id}（編集）。{id} の下の画面（answers・day など）はふくめない。
 */
export function isEventFormRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/organizer/events/new") return true;
  return /^\/organizer\/events\/[0-9a-f-]{36}\/?$/i.test(pathname);
}
