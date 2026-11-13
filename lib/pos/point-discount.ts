/**
 * レジでイベントポイントを「お会計の割引」に使うときの計算。画面（カート）とサーバー（会計）で同じものを使う。
 *
 * - 1pt ＝ yenPerPoint 円。引けるのは「お会計」「1回の上限」「持っているポイント」のいちばん小さいところまで
 * - 使うポイントは 1pt 単位（引く額はいつも yenPerPoint の倍数。端数の円は現金で払う）
 * - requestedPoints を渡さないときは、使えるだけ全部使う
 */
export type PointDiscountSettings = {
  yenPerPoint: number;
  /** 1回のお会計で引ける上限（円）。null は上限なし */
  maxYen: number | null;
};

export type PointDiscountPlan = {
  /** この会計で使えるいちばん多いポイント */
  maxPoints: number;
  pointsUsed: number;
  discountYen: number;
  /** 割引のあとに払うお金 */
  payYen: number;
  /** 上限で止まっているか（持っているポイントやお会計ではなく） */
  cappedByLimit: boolean;
};

/** レジの − ＋ で動かす量 */
export const POINT_DISCOUNT_STEP = 100;

export function planPointDiscount(
  subtotalYen: number,
  balance: number,
  settings: PointDiscountSettings,
  requestedPoints?: number | null
): PointDiscountPlan {
  const subtotal = Math.max(0, Math.floor(subtotalYen));
  const rate = Math.min(100, Math.max(1, Math.floor(settings.yenPerPoint) || 1));
  const cap = settings.maxYen != null && settings.maxYen >= 0 ? Math.floor(settings.maxYen) : null;
  const have = Math.max(0, Math.floor(balance));

  const byTotal = Math.floor(subtotal / rate);
  const byCap = cap == null ? Number.POSITIVE_INFINITY : Math.floor(cap / rate);
  const maxPoints = Math.max(0, Math.min(have, byTotal, byCap));

  const want =
    requestedPoints == null || !Number.isFinite(requestedPoints) ? maxPoints : Math.floor(requestedPoints);
  const pointsUsed = Math.min(maxPoints, Math.max(0, want));
  const discountYen = pointsUsed * rate;

  return {
    maxPoints,
    pointsUsed,
    discountYen,
    payYen: subtotal - discountYen,
    // 上限がなければもっと引けた（お会計が残っていて、ポイントも足りている）
    cappedByLimit: cap != null && maxPoints > 0 && maxPoints === byCap && byCap < byTotal,
  };
}

/** − ＋ で次に使うポイント。100pt ずつ動かし、端は「0」と「いちばん多い量」で止める */
export function stepPointDiscount(current: number, maxPoints: number, direction: 1 | -1): number {
  if (direction > 0) {
    const next = Math.floor(current / POINT_DISCOUNT_STEP) * POINT_DISCOUNT_STEP + POINT_DISCOUNT_STEP;
    return Math.min(maxPoints, next);
  }
  if (current <= 0) return 0;
  const next = Math.ceil(current / POINT_DISCOUNT_STEP) * POINT_DISCOUNT_STEP - POINT_DISCOUNT_STEP;
  return Math.max(0, next);
}
