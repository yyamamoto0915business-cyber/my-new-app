import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eye } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { readStorePreview } from "@/lib/stores/store-preview";
import { StoreHomepage } from "@/components/stores/detail/StoreHomepage";

/** 下書きのお店のプレビュー（リンクを知っている人だけ。検索には出さない） */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー | MachiGlyph",
  robots: { index: false, follow: false },
};

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(new Date(iso));
}

export default async function StorePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();
  const data = await readStorePreview(admin, token);
  if (!data) notFound();

  return (
    <main className="min-h-[70vh] bg-[#f7f9f6]">
      <div className="border-b border-[#ecdcae] bg-[#fbf5e3] px-4 py-2.5 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 text-[12.5px] font-bold text-[#7a5f1c]">
          <Eye className="size-4" aria-hidden />
          プレビュー：このページはまだ公開されていません
          <span className="font-semibold text-[#9a8550]">（{fmt(data.expiresAt)}まで見られます）</span>
        </p>
      </div>
      <StoreHomepage
        store={data.store}
        news={data.news}
        menu={data.menu}
        schedules={data.schedules}
        organizer={data.organizer}
      />
    </main>
  );
}
