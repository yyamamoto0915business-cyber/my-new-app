/** Cookie 名が Supabase Auth セッションかどうか（sb-*-auth-token など） */
export function isSupabaseAuthCookieName(name: string): boolean {
  return name.includes("auth-token");
}

/** ブラウザから見えるセッション Cookie があるか。未ログイン判定の早期リターン用 */
export function hasDocumentSupabaseAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return false;
    const name = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    return isSupabaseAuthCookieName(name) && value.length > 0;
  });
}
