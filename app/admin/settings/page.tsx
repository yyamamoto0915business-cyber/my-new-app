import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";

type LogRow = {
  id: string;
  created_at: string;
  action_type: string;
  reason: string | null;
  admin_email: string | null;
  admin: { display_name: string | null; email: string | null } | null;
  organizer: { organization_name: string | null } | null;
};

function actionLabel(type: string): string {
  const map: Record<string, string> = {
    grant_plan: "プラン付与",
    grant_plan_unlimited: "無期限プラン付与",
    revoke_grant: "付与取消",
    set_featured: "注目設定",
    unset_featured: "注目解除",
    update_event_status: "イベント公開状態変更",
    update_inquiry_status: "問い合わせ更新",
  };
  return map[type] ?? type;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const tab =
    sp.tab === "permissions" || sp.tab === "system" ? sp.tab : "logs";
  const q = sp.q?.trim() ?? "";

  const tabs = [
    { id: "logs", label: "管理ログ", href: "/admin/settings?tab=logs" },
    {
      id: "permissions",
      label: "権限管理",
      href: "/admin/settings?tab=permissions",
    },
    {
      id: "system",
      label: "システム設定",
      href: "/admin/settings?tab=system",
    },
  ];

  if (tab === "permissions") {
    return (
      <div>
        <AdminPageHeader
          title="管理ログ・設定"
          description="操作履歴の確認と、権限・システム設定を管理します。"
        />
        <AdminTabs tabs={tabs} activeId="permissions" />
        <AdminEmptyState
          title="権限管理は準備中です"
          description="現在は profiles.role の developer_admin と環境変数の許可リストで管理者を判定しています。細分化ロール（reviewer / support 等）は今後追加予定です。"
        />
      </div>
    );
  }

  if (tab === "system") {
    return (
      <div>
        <AdminPageHeader
          title="管理ログ・設定"
          description="操作履歴の確認と、権限・システム設定を管理します。"
        />
        <AdminTabs tabs={tabs} activeId="system" />
        <AdminEmptyState
          title="システム設定は準備中です"
          description="メール通知・メンテナンスモード・ログ保存期間などの設定画面は今後追加予定です。"
        />
      </div>
    );
  }

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <AdminPageHeader
        title="管理ログ・設定"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [logsRes, todayRes, adminCountRes] = await Promise.all([
    supabase
      .from("admin_logs")
      .select(
        `
        id,
        created_at,
        action_type,
        reason,
        admin_email,
        admin:admin_user_id ( display_name, email ),
        organizer:target_organizer_id ( organization_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("admin_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "developer_admin"),
  ]);

  let logs = (logsRes.data ?? []) as unknown as LogRow[];
  if (q) {
    const lower = q.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action_type.toLowerCase().includes(lower) ||
        l.reason?.toLowerCase().includes(lower) ||
        l.organizer?.organization_name?.toLowerCase().includes(lower) ||
        l.admin?.display_name?.toLowerCase().includes(lower)
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="管理ログ・設定"
        description="操作履歴の確認と、権限・システム設定を管理します。"
      />
      <AdminTabs tabs={tabs} activeId="logs" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="今日の操作数" value={todayRes.count ?? 0} />
        <AdminStatCard label="表示中のログ" value={logs.length} />
        <AdminStatCard
          label="管理者アカウント"
          value={adminCountRes.count ?? 0}
          tone="info"
        />
        <AdminStatCard label="重要操作" value="—" helper="フィルタ準備中" />
      </div>

      <AdminFilterBar action="/admin/settings">
        <input type="hidden" name="tab" value="logs" />
        <AdminSearchInput
          defaultValue={q}
          placeholder="操作内容・対象・実行者で検索"
        />
      </AdminFilterBar>

      {logsRes.error ? (
        <p className="text-sm text-red-700">{logsRes.error.message}</p>
      ) : logs.length === 0 ? (
        <AdminEmptyState title="管理ログはまだありません" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">日時</th>
                <th className="px-4 py-3 text-left font-medium">実行者</th>
                <th className="px-4 py-3 text-left font-medium">対象</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
                <th className="px-4 py-3 text-left font-medium">結果</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[#eef4f0] last:border-0"
                >
                  <td className="px-4 py-3.5 text-[#7a9888]">
                    {new Date(log.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3.5">
                    {log.admin?.display_name ??
                      log.admin?.email ??
                      log.admin_email ??
                      "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[#5a7868]">
                    {log.organizer?.organization_name ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">
                      {actionLabel(log.action_type)}
                    </div>
                    {log.reason ? (
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-[#7a9888]">
                        {log.reason}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminStatusBadge tone="success">成功</AdminStatusBadge>
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
