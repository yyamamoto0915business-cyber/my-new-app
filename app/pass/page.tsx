import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParticipationPassView } from "@/components/pass/ParticipationPassView";
import { getApiUser } from "@/lib/api-auth";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchMyParticipationPasses } from "@/lib/db/participation-passes";
import {
  buildPassOnlinePreview,
  parsePassOnlinePreviewMode,
} from "@/lib/pass-online-preview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "参加パス | MachiGlyph",
  description: "申し込み済み・取得済みのイベント参加パスを確認できます",
};

type Props = {
  searchParams: Promise<{ preview?: string }>;
};

export default async function PassPage({ searchParams }: Props) {
  const params = await searchParams;
  const previewMode = parsePassOnlinePreviewMode(params.preview ?? null);
  const user = await getApiUser();

  // プレビュー以外はログイン必須
  if (!user && !previewMode) {
    redirect(getLoginUrl("/pass"));
  }

  const supabase = user ? await createClient() : null;
  const realPasses =
    user && supabase
      ? await fetchMyParticipationPasses(
          supabase,
          user.id,
          user.name?.trim() || "参加者"
        )
      : [];

  const preview = previewMode ? buildPassOnlinePreview(previewMode) : null;
  // プレビュー時は該当パスのみ表示（本番レイアウトでオンラインのみを確認しやすくする）
  const passes = preview ? [preview.pass] : realPasses;

  const demoAccessByPassId = preview
    ? { [preview.pass.id]: preview.access }
    : undefined;

  return (
    <div className="bg-[var(--mg-paper,#faf9f6)] min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:overflow-y-auto">
      <ParticipationPassView
        passes={passes}
        demoAccessByPassId={demoAccessByPassId}
        previewBanner={preview?.bannerLabel ?? null}
      />
    </div>
  );
}
