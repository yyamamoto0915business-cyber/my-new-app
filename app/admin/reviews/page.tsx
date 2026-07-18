import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "events" ? "events" : "identity";

  const tabs = [
    {
      id: "identity",
      label: "本人確認審査",
      href: "/admin/reviews?tab=identity",
    },
    {
      id: "events",
      label: "イベント審査",
      href: "/admin/reviews?tab=events",
    },
  ];

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());

  let draftEvents: Array<{
    id: string;
    title: string;
    date: string;
    created_at: string | null;
    organizerName: string | null;
  }> = [];

  if (supabase && tab === "events") {
    const { data } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        date,
        created_at,
        organizer:organizer_id ( organization_name )
      `
      )
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(50);

    draftEvents = ((data ?? []) as Array<{
      id: string;
      title: string;
      date: string;
      created_at: string | null;
      organizer?: { organization_name?: string | null } | null;
    }>).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      created_at: e.created_at,
      organizerName: e.organizer?.organization_name ?? null,
    }));
  }

  return (
    <div>
      <AdminPageHeader
        title="審査・本人確認"
        description="本人確認とイベント公開審査を一元管理できます。"
      />
      <AdminTabs tabs={tabs} activeId={tab} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="審査待ち" value={0} helper="本人確認・準備中" tone="warning" />
        <AdminStatCard label="再提出" value={0} helper="準備中" />
        <AdminStatCard label="承認済み" value={0} helper="準備中" tone="success" />
        <AdminStatCard label="差し戻し" value={0} helper="準備中" tone="danger" />
        <AdminStatCard
          label="下書きイベント"
          value={draftEvents.length}
          tone="info"
        />
      </div>

      {tab === "identity" ? (
        <AdminEmptyState
          title="本人確認審査は準備中です"
          description="本人確認用テーブル（identity_verifications）を追加後、ここで申請一覧と承認・差し戻しができるようになります。"
        />
      ) : draftEvents.length === 0 ? (
        <AdminEmptyState
          title="審査候補のイベントはありません"
          description="正式な公開審査フローは未導入です。現時点では下書きイベントを候補として表示します。"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#7a9888]">
            ※ 正式な審査キューはありません。下書きイベントを参考表示しています。公開操作はイベント管理から行えます。
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">イベント名</th>
                  <th className="px-4 py-3 text-left font-medium">主催者</th>
                  <th className="px-4 py-3 text-left font-medium">開催日</th>
                  <th className="px-4 py-3 text-left font-medium">状態</th>
                  <th className="px-4 py-3 text-left font-medium" />
                </tr>
              </thead>
              <tbody>
                {draftEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-[#eef4f0] last:border-0"
                  >
                    <td className="px-4 py-3.5 font-medium">{ev.title}</td>
                    <td className="px-4 py-3.5 text-[#5a7868]">
                      {ev.organizerName ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[#5a7868]">{ev.date}</td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge tone="warning">下書き</AdminStatusBadge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href="/admin/events"
                        className="text-xs text-[#1e3848] hover:underline"
                      >
                        イベント管理へ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
