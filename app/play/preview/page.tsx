import type { Metadata } from "next";
import { RallyPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "スタンプラリー（プレビュー） | MachiGlyph",
  description: "参加者のスタンプラリー画面の表示確認（仮データ）",
  robots: { index: false },
};

/** ログイン不要。仮データで参加者のスタンプラリー画面を確認する。DB には書き込まない。 */
export default function RallyPreviewPage() {
  return <RallyPreviewClient />;
}
