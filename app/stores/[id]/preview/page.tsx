import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";
import { listOrganizerAccesses } from "@/lib/organizer/team";
import { loadStorePreviewById } from "@/lib/stores/store-preview";
import { StoreHomepage } from "@/components/stores/detail/StoreHomepage";

/**
 * お店・キッチンカーの管理画面の「プレビューを見る」。
 * 公開前でも、公開したときと同じ見た目で見られる。見られるのは、そのお店の主催者（チームのメンバーも）だけ。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー | MachiGlyph",
  robots: { index: false, follow: false },
};

export default async function StoreOwnerPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCachedAuthUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/stores/${id}/preview`)}`);

  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) notFound();

  const { data: row } = await admin.from("stores").select("organizer_id").eq("id", id).maybeSingle();
  const organizerId = (row as { organizer_id: string } | null)?.organizer_id;
  if (!organizerId) notFound();
  const accesses = await listOrganizerAccesses(supabase, user.id);
  if (!accesses.some((a) => a.organizerId === organizerId)) notFound();

  const data = await loadStorePreviewById(admin, id);
  if (!data) notFound();
  const isPublic = data.store.status === "public";

  return (
    <main className="min-h-[70vh] bg-[#f7f9f6]">
      <div className="border-b border-[#ecdcae] bg-[#fbf5e3] px-4 py-2.5 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 text-[12.5px] font-bold text-[#7a5f1c]">
          <Eye className="size-4" aria-hidden />
          {isPublic ? "プレビュー：公開中のページと同じ見た目です" : "プレビュー：このページはまだ公開されていません"}
          <span className="font-semibold text-[#9a8550]">（あなたにだけ見えています）</span>
        </p>
      </div>
      <StoreHomepage store={data.store} news={data.news} menu={data.menu} schedules={data.schedules} organizer={data.organizer} />
    </main>
  );
}
