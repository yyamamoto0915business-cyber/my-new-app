import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
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

  const { data, error } = await supabase
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

  if (error) {
    return (
      <div className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">管理ログ</h2>
            <p className="mt-1 text-sm text-slate-500">
              管理ログの取得に失敗しました。
            </p>
          </div>
          <div className="text-xs text-slate-500">
            表示件数:{" "}
            <span className="font-semibold text-slate-700">0 件</span>
          </div>
        </header>

        <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="text-sm font-semibold text-rose-900">
            Supabase エラー
          </div>
          <div className="mt-2 whitespace-pre-wrap text-xs text-rose-900/80">
            {error.message}
          </div>
          <div className="mt-3 text-xs text-rose-900/80">
            よくある原因:
            <ul className="mt-1 list-disc pl-5">
              <li>
                DB の RLS により <code>admin_logs</code> が{" "}
                <code>developer_admin</code> 以外に非公開になっている
              </li>
              <li>
                <code>profiles.role</code> が{" "}
                <code>developer_admin</code> に設定されていない（env だけで管理者扱いになっている）
              </li>
              <li>
                サーバー環境変数 <code>SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                が未設定のため Admin Client が使えていない
              </li>
            </ul>
          </div>
        </section>
      </div>
    );
  }

  const logs: LogRow[] =
    (data ?? []).map((row) => {
      const r = row as Record<string, unknown> & {
        admin?: { display_name?: string | null; email?: string | null } | null;
        organizer?: { organization_name?: string | null } | null;
      };
      return {
        id: r.id as string,
        created_at: r.created_at as string,
        action_type: r.action_type as string,
        reason: (r.reason as string | null) ?? null,
        before_value: r.before_value,
        after_value: r.after_value,
        admin_name:
          (r.admin?.display_name as string | null) ??
          (r.admin?.email as string | null) ??
          null,
        organizer_name:
          (r.organizer?.organization_name as string | null) ?? null,
      };
    }) ?? [];

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

