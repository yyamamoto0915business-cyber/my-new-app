import type { Metadata } from "next";
import { ParticipationPassView } from "@/components/pass/ParticipationPassView";

export const metadata: Metadata = {
  title: "参加パス | MachiGlyph",
  description: "申し込み済み・取得済みのイベント参加パスを確認できます",
};

export default function PassPage() {
  return (
    <div className="bg-[var(--mg-paper,#faf9f6)] min-[900px]:h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:overflow-y-auto">
      <ParticipationPassView />
    </div>
  );
}
