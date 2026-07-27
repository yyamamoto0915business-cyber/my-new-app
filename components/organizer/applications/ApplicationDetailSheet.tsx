"use client";

import type { Application } from "./ApplicationCard";

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

const FORM_ANSWER_LABELS: Record<string, string> = {
  desired_role: "希望役割",
  available_time: "参加可能時間",
  message: "応募メッセージ",
  experience: "経験・スキル",
  self_intro: "自己紹介",
  terms: "規約への同意",
  emergency_contact: "緊急連絡先",
  portrait: "顔写真",
  phone: "電話番号",
  age: "年齢",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ApplicationDetailSheetProps = {
  application: Application | null;
  onClose: () => void;
};

export function ApplicationDetailSheet({ application, onClose }: ApplicationDetailSheetProps) {
  if (!application) return null;

  const displayName = application.user?.display_name ?? application.user_id.slice(0, 8);
  const email = application.user?.email ?? null;
  const statusLabel = STATUS_LABELS[application.status] ?? application.status;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-xl sm:max-w-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="font-semibold text-slate-900">応募者詳細</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="space-y-6 p-4 pb-8">
          <section>
            <h3 className="text-xs font-medium text-slate-500">氏名</h3>
            <p className="mt-1 text-base text-slate-900">{displayName}</p>
          </section>
          {email && (
            <section>
              <h3 className="text-xs font-medium text-slate-500">メールアドレス</h3>
              <p className="mt-1 break-all text-base text-slate-900">{email}</p>
            </section>
          )}
          <section>
            <h3 className="text-xs font-medium text-slate-500">ステータス</h3>
            <p className="mt-1 text-base text-slate-900">{statusLabel}</p>
          </section>
          <section>
            <h3 className="text-xs font-medium text-slate-500">申込日時</h3>
            <p className="mt-1 text-base text-slate-900">
              {formatDate(application.created_at)}
            </p>
          </section>
          {application.message && (
            <section>
              <h3 className="text-xs font-medium text-slate-500">メッセージ / 志望理由</h3>
              <p className="mt-1 whitespace-pre-wrap text-base text-slate-900">
                {application.message}
              </p>
            </section>
          )}
          {application.form_completed_at == null ? (
            <section>
              <h3 className="text-xs font-medium text-slate-500">応募フォーム</h3>
              <p className="mt-1 text-sm text-amber-700">詳細未提出</p>
            </section>
          ) : application.form_answers && Object.keys(application.form_answers).length > 0 ? (
            <section>
              <h3 className="text-xs font-medium text-slate-500">応募フォーム回答</h3>
              <dl className="mt-2 space-y-2">
                {Object.entries(application.form_answers).map(([key, value]) => {
                  if (value == null || value === "") return null;
                  const label =
                    FORM_ANSWER_LABELS[key] ?? (key.startsWith("cq-") ? "追加質問" : key);
                  const display =
                    typeof value === "boolean" ? (value ? "同意済み" : "未同意") : String(value);
                  return (
                    <div key={key}>
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-900">
                        {display}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ) : null}
          {application.role_assigned && (
            <section>
              <h3 className="text-xs font-medium text-slate-500">割当役割</h3>
              <p className="mt-1 text-base text-slate-900">{application.role_assigned}</p>
            </section>
          )}
          {application.checked_in_at && (
            <section>
              <h3 className="text-xs font-medium text-slate-500">チェックイン日時</h3>
              <p className="mt-1 text-base text-slate-900">
                {formatDate(application.checked_in_at)}
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
