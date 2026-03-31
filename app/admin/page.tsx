import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organizer } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";

type AdminLogRow = {
  id: string;
  created_at: string;
  action_type: string;
  reason: string | null;
  admin_name: string | null;
  organizer_name: string | null;
};

function SummaryCard(props: {
  label: string;
  value: number;
  helper: string;
  tone?: "default" | "info" | "success" | "warning";
  icon: React.ReactNode;
}) {
  const tone = props.tone ?? "default";
  const toneClasses =
    tone === "info"
      ? "border-sky-200 bg-sky-50"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";
  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-xl border ${toneClasses} p-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{props.label}</div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-500">
          {props.icon}
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">
        {props.value.toLocaleString("ja-JP")}
      </div>
      <div className="text-xs text-slate-500">{props.helper}</div>
    </div>
  );
}

function LogRow({ log }: { log: AdminLogRow }) {
  return (
    <tr className="border-b border-slate-100 text-sm last:border-0">
      <td className="px-3 py-2 align-top text-xs text-slate-500">
        {new Date(log.created_at).toLocaleString("ja-JP")}
      </td>
      <td className="px-3 py-2 align-top">
        <div className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {log.action_type}
        </div>
        {log.reason && (
          <div className="mt-1 text-xs text-slate-500 line-clamp-2">
            {log.reason}
          </div>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs text-slate-700">
        <div>{log.organizer_name ?? "-"}</div>
      </td>
      <td className="px-3 py-2 align-top text-xs text-slate-700">
        <div>{log.admin_name ?? "-"}</div>
      </td>
    </tr>
  );
}

export default async function AdminDashboardPage() {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            開発者ダッシュボード
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Supabase が未設定のため、サマリー情報を表示できません。
          </p>
        </section>
      </div>
    );
  }

  const [{ data: orgRows }, { data: logRows }] = await Promise.all([
    supabase
      .from("organizers")
      .select(
        `
        id,
        organization_name,
        plan,
        manual_grant_active,
        manual_grant_expires_at,
        subscription_status,
        current_period_end
      `
      ),
    supabase
      .from("admin_logs")
      .select(
        `
        id,
        created_at,
        action_type,
        reason,
        admin_user_id,
        target_organizer_id,
        admin:admin_user_id ( display_name, email ),
        organizer:target_organizer_id ( organization_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const organizers = (orgRows ?? []) as unknown as Organizer[];

  const now = new Date();
  let total = organizers.length;
  let freeCount = 0;
  let paidCount = 0;
  let manualActiveCount = 0;
  let expiringSoonCount = 0;

  for (const o of organizers) {
    const info = resolveEffectivePlan(o);
    if (info.currentPlan === "free") {
      freeCount += 1;
    } else {
      paidCount += 1;
    }
    if (info.manualGrantActive) {
      manualActiveCount += 1;
      if (info.manualGrantExpiresAt) {
        const expires = new Date(info.manualGrantExpiresAt);
        const diffDays =
          (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) {
          expiringSoonCount += 1;
        }
      }
    }
  }

  const logs: AdminLogRow[] =
    (logRows ?? []).map((row: any) => ({
      id: row.id as string,
      created_at: row.created_at as string,
      action_type: row.action_type as string,
      reason: (row.reason as string | null) ?? null,
      admin_name:
        (row.admin?.display_name as string | null) ??
        (row.admin?.email as string | null) ??
        null,
      organizer_name:
        (row.organizer?.organization_name as string | null) ?? null,
    })) ?? [];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          開発者ダッシュボード
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          MachiGlyph の主催者プランと管理操作の状況を、ひと目で把握できる開発者専用の画面です。
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="全主催者数"
          value={total}
          helper="登録済みの主催者アカウント"
          tone="default"
          icon={
            <span className="h-3 w-3 rounded-sm bg-slate-400" aria-hidden />
          }
        />
        <SummaryCard
          label="無料プラン"
          value={freeCount}
          helper="現在 free として扱われている主催者"
          tone="default"
          icon={<span className="h-3 w-3 rounded-sm bg-slate-300" />}
        />
        <SummaryCard
          label="有料プラン"
          value={paidCount}
          helper="Stripe / 手動付与含む有料利用中"
          tone="info"
          icon={<span className="h-3 w-3 rounded-sm bg-sky-400" />}
        />
        <SummaryCard
          label="手動付与中"
          value={manualActiveCount}
          helper="manual_grant_active が有効な主催者"
          tone="success"
          icon={<span className="h-3 w-3 rounded-sm bg-emerald-500" />}
        />
        <SummaryCard
          label="期限切れ間近"
          value={expiringSoonCount}
          helper="7日以内に手動付与が切れる主催者"
          tone="warning"
          icon={<span className="h-3 w-3 rounded-sm bg-amber-400" />}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              最近の管理操作ログ
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              直近 5 件のプラン付与・取消などの操作履歴です。
            </p>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            すべて見る
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
            まだ管理操作のログがありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-0.5">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-1 text-left">日時</th>
                  <th className="px-3 py-1 text-left">操作内容</th>
                  <th className="px-3 py-1 text-left">対象主催者</th>
                  <th className="px-3 py-1 text-left">実行者</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

