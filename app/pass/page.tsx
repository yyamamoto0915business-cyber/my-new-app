import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParticipationPassView } from "@/components/pass/ParticipationPassView";
import { getApiUser } from "@/lib/api-auth";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchMyParticipationPasses } from "@/lib/db/participation-passes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "参加パス | MachiGlyph",
  description: "申し込み済み・取得済みのイベント参加パスを確認できます",
};

export default async function PassPage() {
  const user = await getApiUser();
  if (!user) {
    redirect(getLoginUrl("/pass"));
  }

  const supabase = await createClient();
  const passes = supabase
    ? await fetchMyParticipationPasses(
        supabase,
        user.id,
        user.name?.trim() || "参加者"
      )
    : [];

  return (
    <div className="bg-[var(--mg-paper,#faf9f6)] min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:overflow-y-auto">
      <ParticipationPassView passes={passes} />
    </div>
  );
}
