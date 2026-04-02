export const PUBLIC_EVENT_STATUSES = ["published", "public"] as const;

export function isPublicEventStatus(status: unknown): boolean {
  return typeof status === "string" && PUBLIC_EVENT_STATUSES.includes(status as (typeof PUBLIC_EVENT_STATUSES)[number]);
}

export function normalizeEventStatus(status: unknown): "draft" | "published" | "archived" | undefined {
  if (status === "draft" || status === "published" || status === "archived") return status;
  // Legacy compatibility: old rows may store "public"
  if (status === "public") return "published";
  return undefined;
}
