"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "./ApplicationCard";
import {
  ApplicationFormAnswerSections,
  ExpandableText,
  getApplicationFormViewModel,
} from "./ApplicationFormAnswerSections";
import type { ApplicationFormConfig } from "@/lib/recruitment-application-form";

function formatApplicationDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  if (/^[a-zA-Z]/.test(t)) return t.slice(0, 2).toUpperCase();
  return t.slice(0, 1);
}

function resolveDisplayName(app: Application): string {
  const profileName = app.user?.display_name?.trim();
  if (profileName) return profileName;
  const email = app.user?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "応募者";
}

function statusMeta(status: string): { label: string; className: string } {
  if (status === "pending") {
    return { label: "未確認", className: "border-amber-200/90 bg-amber-50/90 text-amber-800" };
  }
  if (status === "on_hold") {
    return { label: "保留", className: "border-yellow-200 bg-yellow-50 text-yellow-800" };
  }
  if (status === "checked_in") {
    return { label: "到着済み", className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800" };
  }
  if (status === "accepted" || status === "confirmed") {
    return { label: "承認済み", className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800" };
  }
  if (status === "rejected") {
    return { label: "却下", className: "border-red-200/80 bg-red-50/90 text-red-700" };
  }
  return { label: status, className: "border-[#e8e6e0] bg-[#f5f4f0] text-[#6b6762]" };
}

type ApplicationDetailSheetProps = {
  application: Application | null;
  formConfig?: ApplicationFormConfig | null;
  recruitmentTimeLabel?: string;
  onClose: () => void;
  onAccept?: (appId: string) => void;
  onReject?: (appId: string) => void;
  onHold?: (appId: string) => void;
  onChat?: (userId: string) => void;
  onCheckIn?: (appId: string) => void;
  onSaveMemo?: (appId: string, memo: string) => Promise<void>;
};

export function ApplicationDetailSheet({
  application,
  formConfig,
  recruitmentTimeLabel = "—",
  onClose,
  onAccept,
  onReject,
  onHold,
  onChat,
  onCheckIn,
  onSaveMemo,
}: ApplicationDetailSheetProps) {
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);

  useEffect(() => {
    setMemo(application?.organizer_memo ?? "");
    setMemoOpen(Boolean(application?.organizer_memo?.trim()));
  }, [application?.id, application?.organizer_memo]);

  if (!application) return null;

  const name = resolveDisplayName(application);
  const email = application.user?.email ?? "";
  const meta = statusMeta(application.status);
  const isPending = application.status === "pending" || application.status === "on_hold";
  const isAccepted =
    application.status === "accepted" ||
    application.status === "confirmed" ||
    application.status === "checked_in";
  const isRejected = application.status === "rejected";
  const arrived = Boolean(application.checked_in_at);
  const canMarkArrived = isAccepted && !arrived && Boolean(onCheckIn);
  const { roleLabel, message, formPending } = getApplicationFormViewModel(
    application,
    formConfig
  );
  const hasMemo = Boolean(memo.trim() || application.organizer_memo?.trim());
  const showMessageSection = Boolean(message) || !formPending;

  const handleSaveMemo = async () => {
    if (!onSaveMemo) return;
    setSaving(true);
    try {
      await onSaveMemo(application.id, memo.slice(0, 500));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="mg-apps-detail-m mg-apps-detail-m__sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-[#e8e6e0] shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0 sm:border-[#e8e6e0]">
        <div className="mg-apps-detail-m__head flex shrink-0 flex-col">
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
            <span className="mg-apps-detail-m__handle" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1.5 sm:py-3">
            <h2 className="mg-apps-detail-m__title">応募者詳細</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-[13px] font-medium text-[#6b7569] hover:bg-white/70 hover:text-[#3a3428]"
              aria-label="閉じる"
            >
              閉じる
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {/* プロフィール＋役割を1カードに圧縮 */}
          <div className="mg-apps-detail-m__card px-3 py-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0e4] text-[14px] font-bold text-[#3a633d] shadow-[0_1px_4px_rgba(44,42,40,0.05)]">
                {initialsFromName(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-[16px] font-semibold leading-tight text-[#1a2818]">
                    {name}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      meta.className
                    )}
                  >
                    {meta.label}
                  </span>
                  {formPending ? (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      フォーム未提出
                    </span>
                  ) : null}
                  {isAccepted ? (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        arrived
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      )}
                    >
                      {arrived ? "到着済" : "未到着"}
                    </span>
                  ) : null}
                </div>
                {email ? (
                  <p className="mt-0.5 break-all text-[11px] text-[#6b7569]">{email}</p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-[#8a9e80]">
                  応募日時 {formatApplicationDate(application.created_at)}
                  {arrived ? (
                    <>
                      <span className="mx-1 text-[#d0d6cc]">·</span>
                      到着 {formatApplicationDate(application.checked_in_at)}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-x-3 border-t border-[#f0f2ec] px-0 pt-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-none text-[#5f6f5c]">希望役割</p>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-[#1a2818]">
                  {roleLabel}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium leading-none text-[#5f6f5c]">募集時間帯</p>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-[#1a2818]">
                  {recruitmentTimeLabel}
                </p>
              </div>
            </div>
          </div>

          <ApplicationFormAnswerSections
            application={application}
            formConfig={formConfig}
            collapsibleLongText
          />

          {showMessageSection ? (
            <section>
              <h3 className="mg-apps-detail-m__section-label">応募メッセージ</h3>
              <div className="mg-apps-detail-m__card mt-1.5 px-3 py-2.5">
                {message ? (
                  <ExpandableText text={message} />
                ) : (
                  <p className="text-[13px] text-[#8a9e80]">
                    メッセージはまだ入力されていません。
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {onSaveMemo ? (
            <section className="mg-apps-detail-m__card">
              <button
                type="button"
                onClick={() => setMemoOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={memoOpen}
              >
                <span className="mg-apps-detail-m__section-label">
                  メモ (主催者用)
                  {hasMemo ? (
                    <span className="ml-1.5 rounded-full bg-[#eef3ea] px-1.5 py-px text-[9px] font-semibold text-[#3a633d]">
                      あり
                    </span>
                  ) : null}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[#8a9e80] transition-transform",
                    memoOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
              {memoOpen ? (
                <div className="border-t border-[#f0f2ec] px-3 pb-3 pt-2">
                  <div className="mb-1 flex justify-end">
                    <span className="text-[10px] tabular-nums text-[#b0bab0]">
                      {memo.length} / 500
                    </span>
                  </div>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value.slice(0, 500))}
                    onBlur={() => {
                      if ((application.organizer_memo ?? "") !== memo) {
                        void handleSaveMemo();
                      }
                    }}
                    placeholder="メモを入力 (応募者には表示されません)"
                    rows={3}
                    className="w-full resize-y rounded-lg border border-[#e8e6e0] bg-[#fafcf8] px-2.5 py-2 text-[13px] text-[#1a2818] outline-none focus:border-[#6BBF3E] focus:bg-white"
                  />
                  {saving ? (
                    <p className="mt-1 text-[10px] text-[#8a9e80]">保存中…</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="mg-apps-detail-m__footer shrink-0 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {isPending ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {onAccept ? (
                  <button
                    type="button"
                    onClick={() => onAccept(application.id)}
                    className="mg-apps-detail-m__btn-accept"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    承認する
                  </button>
                ) : null}
                {onChat ? (
                  <button
                    type="button"
                    onClick={() => onChat(application.user_id)}
                    className="mg-apps-detail-m__btn-ghost"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    チャット
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {onHold ? (
                  <button
                    type="button"
                    onClick={() => onHold(application.id)}
                    className="mg-apps-detail-m__btn-hold"
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    保留
                  </button>
                ) : null}
                {onReject ? (
                  <button
                    type="button"
                    onClick={() => onReject(application.id)}
                    className="mg-apps-detail-m__btn-reject"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    却下
                  </button>
                ) : null}
              </div>
              <p className="text-center text-[10px] text-[#8a9e80]">
                {formPending
                  ? "※ フォーム未提出でも承認できます。提出後に詳細を確認してください。"
                  : "※ 承認するとお知らせで参加パスが届きます。"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {canMarkArrived ? (
                  <button
                    type="button"
                    onClick={() => onCheckIn?.(application.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#b5dba0] bg-[#f4faef] px-3 py-2.5 text-[13px] font-semibold text-[#2a7530]"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    到着を記録
                  </button>
                ) : null}
                {onChat ? (
                  <button
                    type="button"
                    onClick={() => onChat(application.user_id)}
                    className={cn(
                      "flex-1",
                      isAccepted
                        ? "mg-apps-detail-m__btn-accept"
                        : "mg-apps-detail-m__btn-ghost"
                    )}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {isAccepted ? "チャットで連絡" : "チャット"}
                  </button>
                ) : null}
                {isRejected && onAccept ? (
                  <button
                    type="button"
                    onClick={() => onAccept(application.id)}
                    className="mg-apps-detail-m__btn-ghost"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    承認に戻す
                  </button>
                ) : null}
              </div>
              {canMarkArrived ? (
                <p className="text-center text-[10px] text-[#8a9e80]">
                  ※ 当日は参加パス提示が基本です。必要なら主催側で到着を記録できます。
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
