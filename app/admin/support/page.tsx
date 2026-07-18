import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  contactCategoryLabel,
  contactStatusLabel,
} from "@/lib/contact";

type InquiryRow = {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  user_id: string;
  profile: { display_name: string | null; email: string | null } | null;
};

function statusTone(status: string) {
  if (status === "closed") return "neutral" as const;
  if (status === "in_progress") return "info" as const;
  return "warning" as const;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "reports" ? "reports" : "inquiries";
  const q = sp.q?.trim() ?? "";
  const statusFilter = sp.status ?? "all";

  const tabs = [
    {
      id: "inquiries",
      label: "お問い合わせ",
      href: "/admin/support?tab=inquiries",
    },
    {
      id: "reports",
      label: "通報・報告",
      href: "/admin/support?tab=reports",
    },
  ];

  if (tab === "reports") {
    return (
      <div>
        <AdminPageHeader
          title="問い合わせ・通報"
          description="ユーザーからの問い合わせと通報を確認・対応できます。"
        />
        <AdminTabs tabs={tabs} activeId="reports" />
        <AdminEmptyState
          title="通報機能は準備中です"
          description="通報用テーブルがまだないため、ここでは表示できません。お問い合わせは「お問い合わせ」タブから確認できます。"
        />
      </div>
    );
  }

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <AdminPageHeader
        title="問い合わせ・通報"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const [listRes, openRes, progressRes, closedRes] = await Promise.all([
    supabase
      .from("contact_inquiries")
      .select(
        `
        id,
        category,
        subject,
        status,
        created_at,
        user_id,
        profile:user_id ( display_name, email )
      `
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
  ]);

  let rows = (listRes.data ?? []) as unknown as InquiryRow[];
  if (statusFilter !== "all") {
    rows = rows.filter((r) => r.status === statusFilter);
  }
  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.subject.toLowerCase().includes(lower) ||
        r.profile?.display_name?.toLowerCase().includes(lower) ||
        r.profile?.email?.toLowerCase().includes(lower)
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="問い合わせ・通報"
        description="ユーザーからの問い合わせと通報を確認・対応できます。"
      />
      <AdminTabs tabs={tabs} activeId="inquiries" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="未対応"
          value={openRes.count ?? 0}
          tone="warning"
        />
        <AdminStatCard
          label="対応中"
          value={progressRes.count ?? 0}
          tone="info"
        />
        <AdminStatCard label="完了" value={closedRes.count ?? 0} tone="success" />
        <AdminStatCard label="通報" value={0} helper="準備中" tone="danger" />
      </div>

      <AdminFilterBar action="/admin/support">
        <input type="hidden" name="tab" value="inquiries" />
        <AdminSearchInput
          defaultValue={q}
          placeholder="件名・送信者名・メール"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-10 rounded-lg border border-[#c8dcd0] bg-white px-3 text-sm"
        >
          <option value="all">すべての状態</option>
          <option value="open">未対応</option>
          <option value="in_progress">対応中</option>
          <option value="closed">完了</option>
        </select>
      </AdminFilterBar>

      {listRes.error ? (
        <p className="text-sm text-red-700">{listRes.error.message}</p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="お問い合わせはまだありません"
          description="ユーザーが /contact から送信すると、ここに表示されます。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">受付日時</th>
                <th className="px-4 py-3 text-left font-medium">件名</th>
                <th className="px-4 py-3 text-left font-medium">区分</th>
                <th className="px-4 py-3 text-left font-medium">送信者</th>
                <th className="px-4 py-3 text-left font-medium">状態</th>
                <th className="px-4 py-3 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#eef4f0] last:border-0"
                >
                  <td className="px-4 py-3.5 text-[#7a9888]">
                    {new Date(row.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#0e1610]">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3.5 text-[#5a7868]">
                    {contactCategoryLabel(row.category)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div>{row.profile?.display_name ?? "—"}</div>
                    <div className="text-[11px] text-[#7a9888]">
                      {row.profile?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminStatusBadge tone={statusTone(row.status)}>
                      {contactStatusLabel(row.status)}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="text-xs font-medium text-[#1e3848] hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
