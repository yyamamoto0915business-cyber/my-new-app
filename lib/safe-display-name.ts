/**
 * 人の名前として出してよい文字にする。表示名にメールアドレスが入っている人がいるので、
 * 「@」をふくむものは出さずに、代わりの呼び名（参加者・応募者など）にする。
 */
export function safeDisplayName(name: string | null | undefined, fallback: string): string {
  const n = name?.trim();
  if (!n || n.includes("@")) return fallback;
  return n;
}
