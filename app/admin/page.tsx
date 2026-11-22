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
import { AdminMobileMore } from "@/components/admin/AdminMobileMore";
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
    grant_unlimited: "プランを無期限付与",
    dismiss_report: "通報を対応済みに",
    hide_reported_content: "通報された投稿を非表示",
    update_reason: "理由を更新",
    update_recruitment_status: "募集の公開状態を変更",
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

      {(() => {
        const todos = [
          { href: "/admin/support", label: "未対応の問い合わせ", count: data.openInquiries, tone: "danger" as const },
          { href: "/admin/reviews", label: "本人確認の審査", count: data.todoIdentity, tone: "warning" as const },
          { href: "/admin/reviews?tab=events", label: "イベント承認待ち", count: data.todoEventReview, tone: "info" as const },
          { href: "/admin/support?tab=reports", label: "通報・報告", count: data.todoReports, tone: "danger" as const },
          { href: "/admin/passes?tab=refunds", label: "返金確認", count: data.todoRefunds, tone: "warning" as const },
        ];
        const active = todos.filter((t) => t.count > 0);
        const idle = todos.filter((t) => t.count === 0);
        return (
          <section>
            <h2 className="mb-2 text-sm font-bold text-[#173f2c]">今すぐ対応すること</h2>
            {/* スマホ：対応が要るものだけカードで出し、0件のものは1行にまとめる */}
            <div className="space-y-2 min-[768px]:hidden">
              {active.length === 0 ? (
                <p className="rounded-xl border border-[#d4e6da] bg-white px-4 py-3 text-[13.5px] font-semibold text-[#2f6b4a]">
                  ✓ いま対応が必要なことはありません
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {active.map((t) => (
                    <AdminTodoCard key={t.href} href={t.href} label={t.label} count={t.count} tone={t.tone} />
                  ))}
                </div>
              )}
              {active.length > 0 && idle.length > 0 ? (
                <p className="px-1 text-[12px] text-[#6b776f]">
                  0件：{idle.map((t) => t.label).join("・")}
                </p>
              ) : null}
            </div>
            {/* PC：5つを横に並べる（0件は灰色） */}
            <div className="hidden gap-2 min-[768px]:grid min-[768px]:grid-cols-3 min-[1200px]:grid-cols-5">
              {todos.map((t) => (
                <AdminTodoCard key={t.href} href={t.href} label={t.label} count={t.count} tone={t.tone} />
              ))}
            </div>
          </section>
        );
      })()}

      <section className="admin-stats grid grid-cols-3 gap-2.5">
        <AdminStatCard label="ユーザー数" value={data.usersTotal} />
        <AdminStatCard label="主催者数" value={data.organizersTotal} />
        <AdminStatCard label="公開イベント" value={data.publishedEvents} tone="success" />
      </section>

      {/* スマホ：最近の動き・サービス状況・最近のイベントはたたんでおく */}
      <AdminMobileMore label="最近の動き・サービス状況を見る">
      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#d8e8dc] bg-white p-3 shadow-sm lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#0e1610]">
              最近のお問い合わせ
            </h2>
            <Link
              href="/admin/support"
              className="text-[11px] text-[#173f2c] hover:underline"
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
              className="text-[11px] text-[#173f2c] hover:underline"
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
            className="text-[11px] text-[#173f2c] hover:underline"
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
                      className="text-[11px] text-[#173f2c] hover:underline"
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
      </AdminMobileMore>
    </div>
  );
}
