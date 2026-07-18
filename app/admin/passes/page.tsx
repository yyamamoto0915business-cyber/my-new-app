import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  getAdminOrders,
  getAdminPasses,
} from "@/lib/admin/panel-queries";

function paymentTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "refunded" || status === "failed") return "danger" as const;
  return "neutral" as const;
}

function paymentLabel(status: string) {
  if (status === "paid") return "支払い済み";
  if (status === "pending") return "未入金";
  if (status === "refunded") return "返金済み";
  if (status === "failed") return "失敗";
  if (status === "free") return "無料";
  return status;
}

export default async function AdminPassesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab =
    sp.tab === "payments" || sp.tab === "refunds" ? sp.tab : "passes";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const q = sp.q ?? "";

  const tabs = [
    { id: "passes", label: "参加パス一覧", href: "/admin/passes?tab=passes" },
    {
      id: "payments",
      label: "決済一覧",
      href: "/admin/passes?tab=payments",
    },
    {
      id: "refunds",
      label: "返金対応",
      href: "/admin/passes?tab=refunds",
    },
  ];

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <AdminPageHeader
        title="参加パス・決済"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [passCount, checkinToday, monthOrders, pendingOrders, refundedOrders] =
    await Promise.all([
      supabase
        .from("event_participants")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("event_checkins")
        .select("id", { count: "exact", head: true })
        .gte("checked_in_at", todayStart.toISOString()),
      supabase
        .from("event_orders")
        .select("amount")
        .eq("status", "paid")
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("event_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("event_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "refunded"),
    ]);

  const monthSales = ((monthOrders.data ?? []) as { amount: number }[]).reduce(
    (s, r) => s + (r.amount ?? 0),
    0
  );

  return (
    <div>
      <AdminPageHeader
        title="参加パス・決済"
        description="参加パス、決済状況、返金対応を一元管理できます。"
      />
      <AdminTabs tabs={tabs} activeId={tab} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="発行済み参加パス" value={passCount.count ?? 0} />
        <AdminStatCard
          label="本日のチェックイン"
          value={checkinToday.count ?? 0}
          tone="success"
        />
        <AdminStatCard
          label="今月売上"
          value={`¥${monthSales.toLocaleString("ja-JP")}`}
        />
        <AdminStatCard
          label="未入金"
          value={pendingOrders.count ?? 0}
          tone="warning"
        />
        <AdminStatCard
          label="返金済み"
          value={refundedOrders.count ?? 0}
          tone="danger"
        />
      </div>

      {tab === "passes" ? (
        <PassesTab supabaseReady q={q} page={page} />
      ) : null}
      {tab === "payments" ? (
        <OrdersTab status="all" page={page} />
      ) : null}
      {tab === "refunds" ? (
        <>
          <OrdersTab status="refunded" page={page} />
          <div className="mt-4">
            <AdminEmptyState
              title="返金申請フローは準備中です"
              description="現状は event_orders の返金済みレコードを表示しています。申請・承認ワークフロー用テーブルは今後追加予定です。"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

async function PassesTab({
  q,
  page,
}: {
  supabaseReady?: boolean;
  q: string;
  page: number;
}) {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) return null;

  const { items, total, pageSize } = await getAdminPasses(supabase, {
    q,
    page,
    pageSize: 30,
  });

  return (
    <>
      <AdminFilterBar action="/admin/passes">
        <input type="hidden" name="tab" value="passes" />
        <AdminSearchInput
          defaultValue={q}
          placeholder="パスID・イベント名・購入者"
        />
      </AdminFilterBar>
      <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">パスID</th>
              <th className="px-4 py-3 text-left font-medium">イベント</th>
              <th className="px-4 py-3 text-left font-medium">購入者</th>
              <th className="px-4 py-3 text-left font-medium">支払い</th>
              <th className="px-4 py-3 text-left font-medium">チェックイン</th>
              <th className="px-4 py-3 text-left font-medium">発行日時</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-[#eef4f0] last:border-0">
                <td className="px-4 py-3.5 font-mono text-xs text-[#5a7868]">
                  {row.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3.5 font-medium">{row.eventTitle ?? "—"}</td>
                <td className="px-4 py-3.5">
                  <div>{row.userName ?? "—"}</div>
                  <div className="text-[11px] text-[#7a9888]">
                    {row.userEmail ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge tone={paymentTone(row.paymentStatus)}>
                    {paymentLabel(row.paymentStatus)}
                  </AdminStatusBadge>
                  {row.amount != null ? (
                    <div className="mt-1 text-[11px] text-[#7a9888]">
                      ¥{row.amount.toLocaleString("ja-JP")}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge tone={row.checkedIn ? "success" : "neutral"}>
                    {row.checkedIn ? "済み" : "未"}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-3.5 text-[#7a9888]">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString("ja-JP")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#7a9888]">
            参加パスがありません
          </p>
        ) : null}
      </div>
      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/admin/passes"
        query={{ tab: "passes", q: q || undefined }}
      />
    </>
  );
}

async function OrdersTab({
  status,
  page,
}: {
  status: string;
  page: number;
}) {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) return null;

  const { items, total, pageSize } = await getAdminOrders(supabase, {
    page,
    pageSize: 30,
    status,
  });

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">決済ID</th>
              <th className="px-4 py-3 text-left font-medium">購入者</th>
              <th className="px-4 py-3 text-left font-medium">イベント</th>
              <th className="px-4 py-3 text-left font-medium">金額</th>
              <th className="px-4 py-3 text-left font-medium">状態</th>
              <th className="px-4 py-3 text-left font-medium">日時</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-[#eef4f0] last:border-0">
                <td className="px-4 py-3.5 font-mono text-xs">
                  {row.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3.5">
                  <div>{row.userName ?? "—"}</div>
                  <div className="text-[11px] text-[#7a9888]">
                    {row.userEmail ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3.5">{row.eventTitle ?? "—"}</td>
                <td className="px-4 py-3.5">
                  ¥{row.amount.toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge tone={paymentTone(row.status)}>
                    {paymentLabel(row.status)}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-3.5 text-[#7a9888]">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString("ja-JP")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#7a9888]">
            決済データがありません
          </p>
        ) : null}
      </div>
      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/admin/passes"
        query={{
          tab: status === "refunded" ? "refunds" : "payments",
          status: status !== "all" ? status : undefined,
        }}
      />
    </>
  );
}
