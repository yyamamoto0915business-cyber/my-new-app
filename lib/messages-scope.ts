/**
 * チャットを「主催者として」と「利用者として」に分ける決まり。
 * 主催者のチャットは /organizer/messages、利用者のチャットは /messages。
 */
export type MessagesScope = "organizer" | "member";

export const ORGANIZER_MESSAGES_HREF = "/organizer/messages";
export const MEMBER_MESSAGES_HREF = "/messages";

export function messagesScopeFromPath(pathname: string | null | undefined): MessagesScope {
  return pathname === ORGANIZER_MESSAGES_HREF || pathname?.startsWith(`${ORGANIZER_MESSAGES_HREF}/`)
    ? "organizer"
    : "member";
}

export function messagesBasePath(scope: MessagesScope): string {
  return scope === "organizer" ? ORGANIZER_MESSAGES_HREF : MEMBER_MESSAGES_HREF;
}

/** 自分が主催者として参加している会話か（フォローでつながった人とのやりとりは利用者側） */
export function isOrganizerConversation(item: {
  my_role?: string | null;
  conversation_kind?: string | null;
}): boolean {
  return item.my_role === "organizer" && item.conversation_kind !== "follow_dm";
}
