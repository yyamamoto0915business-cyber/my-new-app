import { createClient } from "@/lib/supabase/server";
import type { Organizer } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";
import { AdminOrganizerActions } from "@/components/admin/AdminOrganizerActions";

type OrganizerDetail = {
  id: string;
  organizationName: string | null;
  contactEmail: string | null;
  role: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  totalEvents: number;
  publishedEvents: number;
  currentPlan: string;
  billingSource: string;
  manualGrantActive: boolean;
  manualGrantPlan: string | null;
  manualGrantExpiresAt: string | null;
  manualGrantReason: string | null;
};

type LogRow = {
  id: string;
  created_at: string;
  action_type: string;
  reason: string | null;
  admin_name: string | null;
  before_value: unknown;
  after_value: unknown;
};

export default async function AdminOrganizerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">主催者詳細</h2>
        <p className="text-sm text-slate-500">
          Supabase が未設定のため、この主催者の情報を表示できません。
        </p>
      </div>
    );
  }

  const organizerId = params.id;

  const [{ data: organizerRow }, { data: events }, { data: logsRaw }] =
    await Promise.all([
      supabase
        .from("organizers")
        .select(
          `
          id,
          profile_id,
          organization_name,
          contact_email,
          contact_phone,
          plan,
          manual_grant_active,
          manual_grant_plan,
          manual_grant_expires_at,
          manual_grant_reason,
          billing_source,
          subscription_status,
          current_period_end,
          created_at,
          updated_at,
          profile:profile_id ( created_at, role )
        `
        )
        .eq("id", organizerId)
        .single(),
      supabase
        .from("events")
        .select("id, status")
        .eq("organizer_id", organizerId),
      supabase
        .from("admin_logs")
        .select(
          `
          id,
          created_at,
          action_type,
          reason,
          before_value,
          after_value,
          admin:admin_user_id ( display_name, email )
        `
        )
        .eq("target_organizer_id", organizerId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!organizerRow) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">主催者詳細</h2>
        <p className="text-sm text-slate-500">対象の主催者が見つかりませんでした。</p>
      </div>
    );
  }

  const organizer = organizerRow as unknown as Organizer & {
    manual_grant_plan?: string | null;
    manual_grant_reason?: string | null;
    billing_source?: string | null;
    profile?: { created_at?: string | null; role?: string | null } | null;
  };

  const planInfo = resolveEffectivePlan(organizer);
  const totalEvents = events?.length ?? 0;
  const publishedEvents =
    events?.filter((e: any) => e.status === "published").length ?? 0;

  const detail: OrganizerDetail = {
    id: organizer.id,
    organizationName: organizer.organization_name,
    contactEmail: organizer.contact_email,
    role: organizer.profile?.role ?? null,
    createdAt: organizer.profile?.created_at ?? organizer.created_at ?? null,
    updatedAt: organizer.updated_at ?? null,
    totalEvents,
    publishedEvents,
    currentPlan: planInfo.currentPlan,
    billingSource: planInfo.billingSource,
    manualGrantActive: planInfo.manualGrantActive,
    manualGrantPlan: organizer.manual_grant_plan ?? null,
    manualGrantExpiresAt: planInfo.manualGrantExpiresAt,
    manualGrantReason: organizer.manual_grant_reason ?? null,
  };

  const logs: LogRow[] =
    (logsRaw ?? []).map((row: any) => ({
      id: row.id as string,
      created_at: row.created_at as string,
      action_type: row.action_type as string,
      reason: (row.reason as string | null) ?? null,
      before_value: row.before_value,
      after_value: row.after_value,
      admin_name:
        (row.admin?.display_name as string | null) ??
        (row.admin?.email as string | null) ??
        null,
    })) ?? [];

  const now = new Date();
  const expiresAt = detail.manualGrantExpiresAt
    ? new Date(detail.manualGrantExpiresAt)
    : null;
  const diffDays =
    expiresAt != null
      ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      : null;
  const isExpired =
    expiresAt != null && expiresAt.getTime() < now.getTime();
  const expiringSoon =
    detail.manualGrantActive &&
    diffDays != null &&
    diffDays >= 0 &&
    diffDays <= 7;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          主催者詳細（開発者専用）
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          手動付与・取り消しはすべて管理ログに記録されます。内容をよく確認してから実行してください。
        </p>
      </section>

      {/* 1. 主催者基本情報カード */}
      <section className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          主催者基本情報
        </h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <div>
              <div className="text-xs text-slate-500">主催者名</div>
              <div className="mt-0.5 text-sm font-medium text-slate-900">
                {detail.organizationName ?? "主催者"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">メール</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.contactEmail ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">role</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.role ?? "-"}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">登録日</div>
                <div className="mt-0.5 text-sm text-slate-800">
                  {detail.createdAt
                    ? new Date(detail.createdAt).toLocaleDateString("ja-JP")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">最終更新日</div>
                <div className="mt-0.5 text-sm text-slate-800">
                  {detail.updatedAt
                    ? new Date(detail.updatedAt).toLocaleDateString("ja-JP")
                    : "-"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">作成イベント数</div>
                <div className="mt-0.5 text-sm text-slate-800">
                  {detail.totalEvents}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">公開中イベント数</div>
                <div className="mt-0.5 text-sm text-slate-800">
                  {detail.publishedEvents}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. プラン状態カード */}
      <section className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          プラン状態
        </h3>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            {detail.currentPlan === "free"
              ? "現在: 無料プラン"
              : `現在: 有料プラン (${detail.currentPlan})`}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            課金ソース:{" "}
            {detail.billingSource === "manual"
              ? "手動付与"
              : detail.billingSource === "stripe"
              ? "Stripe 課金"
              : "無料扱い"}
          </span>
          {detail.manualGrantActive && !isExpired && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              手動付与中
            </span>
          )}
          {expiringSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              7日以内に手動付与期限切れ
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              手動付与期限切れ
            </span>
          )}
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <div>
              <div className="text-xs text-slate-500">currentPlan</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.currentPlan}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">billingSource</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.billingSource}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">manualGrantPlan</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.manualGrantPlan ?? "-"}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-slate-500">manualGrantActive</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.manualGrantActive ? "true" : "false"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                manualGrantExpiresAt
              </div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.manualGrantExpiresAt
                  ? new Date(
                      detail.manualGrantExpiresAt
                    ).toLocaleString("ja-JP")
                  : detail.manualGrantActive
                  ? "期限なし"
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">grantReason</div>
              <div className="mt-0.5 text-sm text-slate-800">
                {detail.manualGrantReason ?? "-"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 管理操作カード */}
      <section className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          管理操作（手動付与・取消）
        </h3>
        <AdminOrganizerActions organizerId={detail.id} currentReason={detail.manualGrantReason ?? ""} />
      </section>

      {/* 4. 操作履歴カード */}
      <section className="rounded-xl border border-slate-200 bg-white/90 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          この主催者への操作履歴
        </h3>
        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
            この主催者に対する管理操作はまだ記録されていません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-0.5">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-1 text-left">日時</th>
                  <th className="px-3 py-1 text-left">管理者</th>
                  <th className="px-3 py-1 text-left">操作内容</th>
                  <th className="px-3 py-1 text-left">理由</th>
                  <th className="px-3 py-1 text-left">before / after 概要</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 text-sm last:border-0"
                  >
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-700">
                      {log.admin_name ?? "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      <div className="line-clamp-2">
                        {log.reason ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      <div className="line-clamp-2">
                        {JSON.stringify(
                          { before: log.before_value, after: log.after_value },
                          null,
                          0
                        ).slice(0, 120)}
                        {JSON.stringify(
                          { before: log.before_value, after: log.after_value },
                          null,
                          0
                        ).length > 120
                          ? "…"
                          : ""}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}



