import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  AdminActivityList,
  AdminTodoCard,
} from "@/components/admin/AdminActivityList";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getPanelDashboard } from "@/lib/admin/panel-queries";
import { contactCategoryLabel } from "@/lib/contact";

function actionLabel(type: string): string {
  const map: Record<string, string> = {
    grant_plan: "プランを付与",
    grant_plan_unlimited: "プランを無期限付与",
    revoke_grant: "プラン付与を取消",
    set_featured: "注目主催者を設定",
    unset_featured: "注目主催者を解除",
    update_event_status: "イベント公開状態を変更",
    update_inquiry_status: "問い合わせを更新",
  };
  return map[type] ?? type;
}

function eventStatusTone(status: string | null) {
  if (status === "published") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function eventStatusLabel(status: string | null) {
  if (status === "published") return "公開中";
  if (status === "draft") return "下書き";
  if (status === "archived") return "終了";
  return status ?? "—";
}

export default async function AdminDashboardPage() {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());

  if (!supabase) {
    return (
      <div>
        <AdminPageHeader
          title="管理ダッシュボード"
          description="Supabase が未設定のため、サマリーを表示できません。"
        />
      </div>
    );
  }

  const data = await getPanelDashboard(supabase);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="管理ダッシュボード"
        description="サービス全体の状況と、優先対応項目を確認できます。"
      />

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="登録ユーザー数" value={data.usersTotal} />
        <AdminStatCard label="主催者数" value={data.organizersTotal} />
        <AdminStatCard label="公開イベント数" value={data.publishedEvents} tone="success" />
        <AdminStatCard
          label="本人確認待ち"
          value={data.identityPending}
          helper="準備中"
          tone="warning"
        />
        <AdminStatCard
          label="イベント審査待ち"
          value={data.eventReviewPending}
          helper="準備中"
          tone="warning"
        />
        <AdminStatCard
          label="未対応問い合わせ"
          value={data.openInquiries}
          tone={data.openInquiries > 0 ? "danger" : "default"}
        />
      </section>

      <section>
        <h2 className="mb-1.5 text-xs font-semibold text-[#0e1610]">要対応</h2>
        <div className="flex flex-wrap gap-2">
          <AdminTodoCard
            href="/admin/reviews"
            label="本人確認の審査"
            count={data.todoIdentity}
            tone="warning"
          />
          <AdminTodoCard
            href="/admin/reviews?tab=events"
            label="イベント承認待ち"
            count={data.todoEventReview}
            tone="info"
          />
          <AdminTodoCard
            href="/admin/support?tab=reports"
            label="通報・報告"
            count={data.todoReports}
            tone="danger"
          />
          <AdminTodoCard
            href="/admin/passes?tab=refunds"
            label="返金確認"
            count={data.todoRefunds}
            tone="warning"
          />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#d8e8dc] bg-white p-3 shadow-sm lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#0e1610]">
              最近のお問い合わせ
            </h2>
            <Link
              href="/admin/support"
              className="text-[11px] text-[#1e3848] hover:underline"
            >
              すべて
            </Link>
          </div>
          {data.recentInquiries.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#7a9888]">
              お問い合わせはまだありません
            </p>
          ) : (
            <ul className="divide-y divide-[#eef4f0]">
              {data.recentInquiries.slice(0, 4).map((row) => (
                <li key={row.id} className="py-1.5">
                  <Link
                    href={`/admin/inquiries/${row.id}`}
                    className="line-clamp-1 text-xs font-medium text-[#0e1610] hover:underline"
                  >
                    {row.subject}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#7a9888]">
                    <span>{contactCategoryLabel(row.category)}</span>
                    <AdminStatusBadge
                      tone={
                        row.status === "open"
                          ? "warning"
                          : row.status === "closed"
                            ? "neutral"
                            : "info"
                      }
                    >
                      {row.status === "open"
                        ? "未対応"
                        : row.status === "in_progress"
                          ? "対応中"
                          : "完了"}
                    </AdminStatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-[#d8e8dc] bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold text-[#0e1610]">
            サービス状況（30日）
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-[#eaf2ec] px-2.5 py-2">
              <div className="text-[10px] text-[#7a9888]">新規ユーザー</div>
              <div className="text-base font-semibold">{data.newUsers30d}</div>
            </div>
            <div className="rounded-md bg-[#eaf2ec] px-2.5 py-2">
              <div className="text-[10px] text-[#7a9888]">イベント作成</div>
              <div className="text-base font-semibold">{data.newEvents30d}</div>
            </div>
            <div className="rounded-md bg-[#eaf2ec] px-2.5 py-2">
              <div className="text-[10px] text-[#7a9888]">参加申込</div>
              <div className="text-base font-semibold">{data.applications30d}</div>
            </div>
            <div className="rounded-md bg-[#eaf2ec] px-2.5 py-2">
              <div className="text-[10px] text-[#7a9888]">決済総額</div>
              <div className="text-base font-semibold">
                ¥{data.sales30d.toLocaleString("ja-JP")}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e8dc] bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#0e1610]">
              最近の管理アクティビティ
            </h2>
            <Link
              href="/admin/settings?tab=logs"
              className="text-[11px] text-[#1e3848] hover:underline"
            >
              ログ
            </Link>
          </div>
          <AdminActivityList
            items={data.recentLogs.slice(0, 5).map((l) => ({
              id: l.id,
              createdAt: l.createdAt,
              actionLabel: actionLabel(l.actionType),
              actorName: l.adminName,
              targetName: l.organizerName,
            }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-[#d8e8dc] bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#0e1610]">
            最近の主催者・イベント
          </h2>
          <Link
            href="/admin/events"
            className="text-[11px] text-[#1e3848] hover:underline"
          >
            イベント管理
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="border-b border-[#e0ece4] text-[10px] uppercase text-[#7a9888]">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">イベント名</th>
                <th className="px-2 py-1.5 text-left font-medium">主催者</th>
                <th className="px-2 py-1.5 text-left font-medium">開催日</th>
                <th className="px-2 py-1.5 text-left font-medium">申込</th>
                <th className="px-2 py-1.5 text-left font-medium">状態</th>
                <th className="px-2 py-1.5 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.slice(0, 5).map((ev) => (
                <tr key={ev.id} className="border-b border-[#eef4f0] last:border-0">
                  <td className="px-2 py-2 font-medium text-[#0e1610]">
                    {ev.title}
                  </td>
                  <td className="px-2 py-2 text-[#5a7868]">
                    {ev.organizerName ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-[#5a7868]">{ev.date}</td>
                  <td className="px-2 py-2">{ev.participantCount}</td>
                  <td className="px-2 py-2">
                    <AdminStatusBadge tone={eventStatusTone(ev.status)}>
                      {eventStatusLabel(ev.status)}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Link
                      href={`/admin/events?focus=${ev.id}`}
                      className="text-[11px] text-[#1e3848] hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentEvents.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#7a9888]">
              イベントがありません
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
