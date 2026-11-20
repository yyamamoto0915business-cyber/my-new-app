/** ゲームの説明文が「長い」か。改行を含むか60文字をこえたら、真ん中ぞろえをやめて左ぞろえにする */
export function isLongGameDesc(text: string): boolean {
  const t = text.trim();
  return t.includes("\n") || t.length > 60;
}
