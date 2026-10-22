import { sanitizePlace } from "@/lib/organizer/game-experience";
import type { QuizArrivalProof } from "@/lib/organizer/play";

/** リクエストから、チェックポイントに着いた証し（現在地・合言葉）を読む。 */
export function readQuizArrivalProof(body: { here?: unknown; keyword?: unknown }): QuizArrivalProof {
  const here =
    body.here && typeof body.here === "object" && !Array.isArray(body.here)
      ? sanitizePlace((body.here as { lat?: unknown }).lat, (body.here as { lng?: unknown }).lng)
      : null;
  const keyword = typeof body.keyword === "string" ? body.keyword.slice(0, 40) : "";
  return { here, keyword };
}
