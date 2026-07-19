import type { Metadata } from "next";
import { ParticipationPassView } from "@/components/pass/ParticipationPassView";
import {
  buildPassOnlinePreview,
  parsePassOnlinePreviewMode,
  type PassOnlinePreviewMode,
} from "@/lib/pass-online-preview";

export const metadata: Metadata = {
  title: "参加パス（プレビュー） | MachiGlyph",
  description: "オンライン参加パスの表示確認（本番と同じ画面レイアウト）",
};

type Props = {
  searchParams: Promise<{ mode?: string }>;
};

/**
 * ログイン不要。
 * 本番の /pass と同じ ParticipationPassView でオンライン参加パスを確認する。
 */
export default async function PassPreviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const mode =
    parsePassOnlinePreviewMode(params.mode ?? null) ??
    ("online-visible" as PassOnlinePreviewMode);
  const preview = buildPassOnlinePreview(mode);

  return (
    <div className="bg-[var(--mg-paper,#faf9f6)] min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:overflow-y-auto">
      <ParticipationPassView
        passes={[preview.pass]}
        demoAccessByPassId={{ [preview.pass.id]: preview.access }}
        previewBanner={preview.bannerLabel}
      />
    </div>
  );
}
