import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEventVisibilityButton } from "@/components/admin/AdminEventVisibilityButton";
import { getAdminEvents } from "@/lib/admin/panel-queries";

function statusTone(status: string | null) {
  if (status === "published") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function statusLabel(status: string | null) {
  if (status === "published") return "公開中";
  if (status === "draft") return "下書き";
  if (status === "archived") return "終了";
  return status ?? "—";
}

export default async function AdminEventsPage({
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
        title="イベント管理"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const [{ items, total, pageSize }, published, draft, archived] =
    await Promise.all([
      getAdminEvents(supabase, { q, status, page, pageSize: 30 }),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "archived"),
    ]);

  return (
    <div>
      <AdminPageHeader
        title="イベント管理"
        description="登録されているすべてのイベントを確認・管理できます。"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="公開中" value={published.count ?? 0} tone="success" />
        <AdminStatCard label="下書き" value={draft.count ?? 0} tone="warning" />
        <AdminStatCard label="終了" value={archived.count ?? 0} />
        <AdminStatCard label="通報あり" value={0} helper="準備中" tone="danger" />
        <AdminStatCard label="一覧件数" value={total} />
      </div>

      <AdminFilterBar action="/admin/events">
        <AdminSearchInput defaultValue={q} placeholder="イベント名で検索" />
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-[#c8dcd0] bg-white px-3 text-sm"
        >
          <option value="all">すべて</option>
          <option value="published">公開中</option>
          <option value="draft">下書き</option>
          <option value="archived">終了</option>
        </select>
      </AdminFilterBar>

      <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">イベント名</th>
              <th className="px-4 py-3 text-left font-medium">主催者</th>
              <th className="px-4 py-3 text-left font-medium">開催日</th>
              <th className="px-4 py-3 text-left font-medium">地域</th>
              <th className="px-4 py-3 text-left font-medium">申込</th>
              <th className="px-4 py-3 text-left font-medium">CI</th>
              <th className="px-4 py-3 text-left font-medium">状態</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ev) => (
              <tr key={ev.id} className="border-b border-[#eef4f0] last:border-0">
                <td className="px-4 py-3.5 font-medium text-[#0e1610]">
                  {ev.title}
                </td>
                <td className="px-4 py-3.5 text-[#5a7868]">
                  {ev.organizerName ?? "—"}
                </td>
                <td className="px-4 py-3.5 text-[#5a7868]">{ev.date}</td>
                <td className="px-4 py-3.5 text-[#5a7868]">
                  {[ev.prefecture, ev.city].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3.5">{ev.participantCount}</td>
                <td className="px-4 py-3.5">{ev.checkinCount}</td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge tone={statusTone(ev.status)}>
                    {statusLabel(ev.status)}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminEventVisibilityButton
                      eventId={ev.id}
                      currentStatus={ev.status}
                    />
                    <Link
                      href={`/events/${ev.id}`}
                      className="text-xs text-[#1e3848] hover:underline"
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
          <p className="py-10 text-center text-sm text-[#7a9888]">
            イベントがありません
          </p>
        ) : null}
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/admin/events"
        query={{ q: q || undefined, status: status !== "all" ? status : undefined }}
      />
    </div>
  );
}
