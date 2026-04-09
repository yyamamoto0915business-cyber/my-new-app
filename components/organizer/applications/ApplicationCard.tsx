"use client";

export type Application = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  role_assigned: string | null;
  checked_in_at: string | null;
  created_at?: string;
  user?: { display_name: string | null; email: string | null };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "未確認",
  accepted: "承認済み",
  confirmed: "承認済み",
  rejected: "却下",
  canceled: "キャンセル",
  applied: "申請中",
  checked_in: "チェックイン済",
  completed: "完了",
};

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  checked_in: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  pending: "bg-amber-50 text-amber-700 border-amber-200/80",
  applied: "bg-amber-50 text-amber-700 border-amber-200/80",
  rejected: "bg-slate-100 text-slate-600 border-slate-200/80",
  canceled: "bg-slate-100 text-slate-500 border-slate-200/80",
  completed: "bg-slate-100 text-slate-600 border-slate-200/80",
};

function formatApplicationDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ApplicationCardProps = {
  application: Application;
  onAccept: (appId: string) => void;
  onReject: (appId: string) => void;
  onChat: (userId: string) => void;
  onDetail?: (application: Application) => void;
  onFocusPending?: () => void;
};

function resolveDisplayName(application: Application): string {
  const profileName = application.user?.display_name?.trim();
  if (profileName) return profileName;

  const email = application.user?.email?.trim();
  if (email && email.includes("@")) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) return localPart;
  }

  return "応募者";
}

export function ApplicationCard({
  application,
  onAccept,
  onReject,
  onChat,
  onDetail,
  onFocusPending,
}: ApplicationCardProps) {
  const displayName = resolveDisplayName(application);
  const email = application.user?.email ?? null;
  const statusStyle = STATUS_STYLES[application.status] ?? "bg-slate-100 text-slate-600 border-slate-200/80";
  const statusLabel = STATUS_LABELS[application.status] ?? application.status;
  const isPending = application.status === "pending";
  const messagePreview =
    application.message?.trim() || "自己紹介・応募メッセージはまだ入力されていません。";
  const cardClassName = isPending
    ? "rounded-2xl border border-amber-300/80 bg-amber-50/40 shadow-sm transition hover:shadow-md"
    : "rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md";

  return (
    <article className={cardClassName}>
      <div className="p-4 sm:p-5">
        {/* 上段: 名前 + ステータスバッジ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{displayName}</h3>
              <span
                className={`inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium ${statusStyle}`}
              >
                {statusLabel}
              </span>
              {isPending && (
                <button
                  type="button"
                  onClick={onFocusPending}
                  className="inline-flex items-center rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-medium text-white transition hover:bg-amber-700"
                  aria-label="未確認のみ表示する"
                >
                  要対応
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 中段: メール・申込日時 */}
        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
          {email && (
            <p className="truncate" title={email}>
              {email}
            </p>
          )}
          <p className="text-xs text-slate-500">
            応募日時: {formatApplicationDate(application.created_at)}
          </p>
        </div>

        {/* 下段: コメント・アクション */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          {isPending && (
            <div className="mb-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-2.5">
              <p className="text-xs font-medium text-amber-800">未確認の応募です。先に対応できます</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAccept(application.id)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                >
                  承認する
                </button>
                <button
                  type="button"
                  onClick={() => onReject(application.id)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  却下する
                </button>
              </div>
            </div>
          )}
          <p className="text-xs font-medium text-slate-500">応募メッセージ</p>
          <p
            className={`mt-1 rounded-xl border px-3 py-2 text-sm ${
              application.message?.trim()
                ? "line-clamp-3 border-slate-100 bg-slate-50/70 text-slate-700"
                : "border-slate-100 bg-slate-50/40 text-slate-500"
            }`}
          >
            {messagePreview}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onDetail && (
              <button
                type="button"
                onClick={() => onDetail(application)}
                className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                詳細を見る
              </button>
            )}
            <button
              type="button"
              onClick={() => onChat(application.user_id)}
              className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              チャット
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
