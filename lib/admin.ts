// Client-safe admin check. Server-side security is enforced separately via admin-auth.ts.
const ADMIN_EMAILS_RAW: string =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ADMIN_EMAILS : undefined) ?? "";

const ADMIN_EMAILS: Set<string> = new Set(
  ADMIN_EMAILS_RAW.split(",")
    .map((e) => e.trim())
    .filter(Boolean)
);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim());
}
