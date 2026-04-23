import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/db/types";

const LIST_LIMIT = 300;

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: ProfileRole | null;
  created_at: string;
};

function roleLabel(role: ProfileRole | null | undefined): string {
  if (role === "developer_admin") return "開発者";
  if (role === "organizer") return "主催者";
  if (role === "user") return "参加者";
  return role ?? "—";
}

function RoleBadge({ role }: { role: ProfileRole | null | undefined }) {
  const label = roleLabel(role);
  const tone =
    role === "developer_admin"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : role === "organizer"
        ? "bg-sky-50 text-sky-800 ring-sky-100"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${tone}`}
    >
      {label}
    </span>
  );
}

export default async function AdminOthersPage() {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">その他管理</h2>
          <p className="mt-1 text-sm text-slate-500">
            Supabase が未設定のため、登録ユーザー一覧を表示できません。
          </p>
        </header>
      </div>
    );
  }

  const [{ data: profileRows, error: profileError }, { data: organizerRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, display_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT),
      supabase.from("organizers").select("profile_id, organization_name"),
    ]);

  if (profileError) {
    return (
      <div className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">その他管理</h2>
          <p className="mt-1 text-sm text-slate-500">
            登録ユーザー情報の取得に失敗しました。
          </p>
        </header>
        <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="text-sm font-semibold text-rose-900">Supabase エラー</div>
          <div className="mt-2 whitespace-pre-wrap text-xs text-rose-900/80">
            {profileError.message}
          </div>
          {!adminSupabase && (
            <p className="mt-3 text-xs text-rose-900/80">
              管理画面では通常、Service Role（
              <code className="rounded bg-rose-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>
              ）が必要です。RLS により一覧が取得できないことがあります。
            </p>
          )}
        </section>
      </div>
    );
  }

  const orgNameByProfileId = new Map<string, string | null>(
    (organizerRows ?? []).map((o) => [
      (o as { profile_id: string }).profile_id,
      (o as { organization_name: string | null }).organization_name ?? null,
    ])
  );

  const profiles = (profileRows ?? []) as ProfileRow[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">その他管理</h2>
          <p className="mt-1 text-sm text-slate-500">
            アカウント登録済みユーザー（
            <code className="rounded bg-slate-100 px-1 text-xs">profiles</code>
            ）の一覧です。メールはログイン用アカウントに紐づく値です。
          </p>
        </div>
        <div className="text-xs text-slate-500">
          表示件数:{" "}
          <span className="font-semibold text-slate-700">
            {profiles.length.toLocaleString("ja-JP")} 件
          </span>
          {profiles.length >= LIST_LIMIT ? (
            <span className="ml-1 text-amber-700">
              （新しい順・最大 {LIST_LIMIT} 件）
            </span>
          ) : null}
        </div>
      </header>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white/90 p-4">
        <p className="text-xs text-slate-500">
          ※ 個人情報の取り扱いにご注意ください。主催者のプラン操作は「主催者一覧」をご利用ください。
        </p>

        {profiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
            登録ユーザーがありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-0.5">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-1 text-left">登録日時</th>
                  <th className="px-3 py-1 text-left">メール</th>
                  <th className="px-3 py-1 text-left">表示名</th>
                  <th className="px-3 py-1 text-left">ロール</th>
                  <th className="px-3 py-1 text-left">主催者として</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const orgName = orgNameByProfileId.get(p.id) ?? null;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 text-sm last:border-0"
                    >
                      <td className="px-3 py-2 align-top text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleString("ja-JP")}
                      </td>
                      <td className="max-w-[220px] px-3 py-2 align-top text-xs text-slate-800">
                        <span className="break-all">{p.email ?? "—"}</span>
                      </td>
                      <td className="max-w-[160px] px-3 py-2 align-top text-xs text-slate-700">
                        <span className="line-clamp-2 break-all">
                          {p.display_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <RoleBadge role={p.role} />
                      </td>
                      <td className="max-w-[200px] px-3 py-2 align-top text-xs text-slate-700">
                        {orgName ? (
                          <span className="line-clamp-2">{orgName}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav
        className="flex flex-wrap gap-3 text-sm"
        aria-label="関連する管理画面へのリンク"
      >
        <Link
          href="/admin/organizers"
          className="font-medium text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          主催者一覧へ
        </Link>
        <span className="text-slate-300" aria-hidden>
          |
        </span>
        <Link
          href="/admin/logs"
          className="font-medium text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          管理ログへ
        </Link>
      </nav>
    </div>
  );
}
