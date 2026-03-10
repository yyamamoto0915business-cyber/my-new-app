import { createClient } from "@/lib/supabase/server";

type LogRow = {
  id: string;
  created_at: string;
  action_type: string;
  reason: string | null;
  admin_name: string | null;
  organizer_name: string | null;
  before_value: unknown;
  after_value: unknown;
};

export default async function AdminLogsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">管理ログ</h2>
        <p className="text-sm text-slate-500">
          Supabase が未設定のため、管理ログを表示できません。
        </p>
      </div>
    );
  }

  const { data } = await supabase
    .from("admin_logs")
    .select(
      `
      id,
      created_at,
      action_type,
      reason,
      before_value,
      after_value,
      admin:admin_user_id ( display_name, email ),
      organizer:target_organizer_id ( organization_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const logs: LogRow[] =
    (data ?? []).map((row: any) => ({
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
      organizer_name:
        (row.organizer?.organization_name as string | null) ?? null,
    })) ?? [];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">管理ログ</h2>
          <p className="mt-1 text-sm text-slate-500">
            開発者による主催者プラン操作などの履歴を一覧で確認できます。
          </p>
        </div>
        <div className="text-xs text-slate-500">
          表示件数:{" "}
          <span className="font-semibold text-slate-700">
            {logs.length.toLocaleString("ja-JP")} 件
          </span>
        </div>
      </header>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white/90 p-4">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>※ 現在は簡易フィルターのみです。必要に応じて絞り込みを拡張できます。</span>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
            まだ管理ログがありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-0.5">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-1 text-left">日時</th>
                  <th className="px-3 py-1 text-left">管理者</th>
                  <th className="px-3 py-1 text-left">対象主催者</th>
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
                    <td className="px-3 py-2 align-top text-xs text-slate-700">
                      {log.organizer_name ?? "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {log.action_type}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      <div className="line-clamp-2">{log.reason ?? "-"}</div>
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

