/** レジ・当日販売の MachiGlyph 手数料（1%） */
export const POS_PLATFORM_FEE_RATE = 0.01;

/** オンライン決済時のプラットフォーム手数料（円・切り捨てではなく四捨五入） */
export function calcPosPlatformFeeYen(totalYen: number): number {
  if (totalYen <= 0) return 0;
  return Math.round(totalYen * POS_PLATFORM_FEE_RATE);
}

export function calcPosOrganizerNetYen(totalYen: number, feeYen?: number): number {
  const fee = feeYen ?? calcPosPlatformFeeYen(totalYen);
  return Math.max(0, totalYen - fee);
}
