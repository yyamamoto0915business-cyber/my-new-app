/**
 * 会話詳細のみ（利用者 `/messages/[id]`・主催者 `/organizer/messages/[id]`）。一覧は含まない。
 * 会話を開いているときは、スマホの上の帯・下のメニューを出さずに画面いっぱいを使う。
 */
export function isMessagesConversationRoute(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  return /^\/(organizer\/)?messages\/[^/]+$/.test(pathname);
}
