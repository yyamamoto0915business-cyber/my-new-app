import type { Event } from "@/lib/db/types";
import type { GlyphId } from "@/components/ui/GlyphBadge";

/** イベントからグリフバッジ用IDを推測 */
export function getGlyphsForEvent(event: Event): GlyphId[] {
  const glyphs: GlyphId[] = [];
  if (event.price === 0) glyphs.push("free");
  const titleLower = (event.title || "").toLowerCase();
  const descLower = (event.description || "").toLowerCase();
  const tags = event.tags ?? [];
  if (
    titleLower.includes("親子") ||
    titleLower.includes("キッズ") ||
    titleLower.includes("子ども") ||
    descLower.includes("親子") ||
    tags.includes("kids")
  ) {
    glyphs.push("kids");
  }
  if (
    titleLower.includes("体験") ||
    titleLower.includes("ワークショップ") ||
    titleLower.includes("workshop") ||
    tags.some((t) => ["workshop", "experience"].includes(t))
  ) {
    glyphs.push("workshop");
  }
  const startHour = parseInt((event.startTime || "09:00").split(":")[0], 10);
  if (startHour >= 18) glyphs.push("night");
  const access = (event.access || event.location || "").toLowerCase();
  if (access.includes("駅") || access.includes("徒歩") || access.includes("歩")) {
    glyphs.push("walkable");
  }
  return glyphs.slice(0, 3); // 最大3個
}
