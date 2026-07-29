import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminRecruitmentVisibilityButton } from "@/components/admin/AdminRecruitmentVisibilityButton";
import { getAdminRecruitments } from "@/lib/admin/panel-queries";

const PAGE_SIZE = 20;

function statusTone(status: string | null) {
  if (status === "public") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function statusLabel(status: string | null) {
  if (status === "public") return "公開中";
  if (status === "draft") return "下書き";
  if (status === "closed") return "終了";
  return status ?? "—";
}

function typeLabel(type: string) {
  if (type === "volunteer") return "ボランティア";
  if (type === "tech_volunteer") return "技術ボランティア";
  if (type === "paid_spot") return "有償スポット";
  if (type === "job") return "求人";
  return type;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  return d || "—";
}

export default async function AdminVolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const status = sp.status ?? "all";
  const q = sp.q ?? "";

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());

  if (!supabase) {
    return (
      <AdminPageHeader
        title="ボランティア管理"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const [{ items, total, pageSize }, publicCount, draftCount, closedCount] =
    await Promise.all([
      getAdminRecruitments(supabase, { q, status, page, pageSize: PAGE_SIZE }),
      supabase
        .from("recruitments")
        .select("id", { count: "exact", head: true })
        .eq("status", "public"),
      supabase
        .from("recruitments")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("recruitments")
        .select("id", { count: "exact", head: true })
        .eq("status", "closed"),
    ]);

  return (
    <div>
      <AdminPageHeader
        title="ボランティア管理"
        description="登録されているすべてのボランティア募集を確認・管理できます。"
      />

      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <AdminStatCard label="公開中" value={publicCount.count ?? 0} tone="success" />
        <AdminStatCard label="下書き" value={draftCount.count ?? 0} tone="warning" />
        <AdminStatCard label="終了" value={closedCount.count ?? 0} />
        <AdminStatCard label="通報あり" value={0} helper="準備中" tone="danger" />
        <AdminStatCard label="一覧件数" value={total} />
      </div>

      <AdminFilterBar action="/admin/volunteers">
        <AdminSearchInput defaultValue={q} placeholder="募集名で検索" />
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-md border border-[#c8dcd0] bg-white px-2 text-xs"
        >
          <option value="all">すべて</option>
          <option value="public">公開中</option>
          <option value="draft">下書き</option>
          <option value="closed">終了</option>
        </select>
      </AdminFilterBar>

      <div className="overflow-x-auto rounded-lg border border-[#d8e8dc] bg-white shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[10px] uppercase text-[#7a9888]">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">募集名</th>
              <th className="px-3 py-1.5 text-left font-medium">主催者</th>
              <th className="px-3 py-1.5 text-left font-medium">種別</th>
              <th className="px-3 py-1.5 text-left font-medium">開催日</th>
              <th className="px-3 py-1.5 text-left font-medium">応募</th>
              <th className="px-3 py-1.5 text-left font-medium">定員</th>
              <th className="px-3 py-1.5 text-left font-medium">状態</th>
              <th className="px-3 py-1.5 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((rec) => (
              <tr key={rec.id} className="border-b border-[#eef4f0] last:border-0">
                <td className="max-w-[220px] px-3 py-1.5 font-medium text-[#0e1610]">
                  <span className="line-clamp-1" title={rec.title}>
                    {rec.title}
                  </span>
                  {rec.eventTitle ? (
                    <span className="mt-0.5 block truncate text-[10px] font-normal text-[#7a9888]">
                      {rec.eventTitle}
                    </span>
                  ) : null}
                </td>
                <td className="max-w-[120px] truncate px-3 py-1.5 text-[#5a7868]">
                  {rec.organizerName ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-[#5a7868]">
                  {typeLabel(rec.type)}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-[#5a7868]">
                  {formatDate(rec.startAt)}
                </td>
                <td className="px-3 py-1.5 tabular-nums">
                  {rec.applicationCount}
                  {rec.approvedCount > 0 ? (
                    <span className="ml-0.5 text-[10px] text-[#7a9888]">
                      ({rec.approvedCount}承認)
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-1.5 tabular-nums">
                  {rec.capacity ?? "—"}
                </td>
                <td className="px-3 py-1.5">
                  <AdminStatusBadge tone={statusTone(rec.status)}>
                    {statusLabel(rec.status)}
                  </AdminStatusBadge>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-nowrap items-center gap-1.5">
                    <AdminRecruitmentVisibilityButton
                      recruitmentId={rec.id}
                      currentStatus={rec.status}
                      compact
                    />
                    <Link
                      href={`/recruitments/${rec.id}`}
                      className="whitespace-nowrap text-[11px] text-[#1e3848] hover:underline"
                      target="_blank"
                    >
                      詳細
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#7a9888]">
            募集がありません
          </p>
        ) : null}
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/admin/volunteers"
        query={{
          q: q || undefined,
          status: status !== "all" ? status : undefined,
        }}
      />
    </div>
  );
}
