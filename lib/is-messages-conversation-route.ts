/** `/messages/[conversationId]` の会話詳細のみ。`/messages` 一覧は含まない。 */
export function isMessagesConversationRoute(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  return /^\/messages\/[^/]+$/.test(pathname);
}
