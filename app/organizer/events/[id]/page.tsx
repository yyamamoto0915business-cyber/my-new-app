"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormStepContent } from "@/components/organizer/events/EventFormStepContent";
import { PassSettingsPcView } from "@/components/organizer/events/PassSettingsPcView";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { getJstNowHm, getJstTodayYmd, toJstTimestamp } from "@/lib/jst-date";
import {
  EventFormPcStepIndicator,
  EventFormSidePanel,
  EventFormStepIndicator,
  type EventFormStep,
} from "@/components/organizer/events/event-form-ui";

type FormErrors = Partial<Record<keyof EventFormData, string>>;

const STATUS_LABELS: Record<string, string> = {
  published: "公開中",
  draft: "下書き",
};

function validateForm(data: EventFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = "イベント名を入力してください";
  if (!data.description.trim())
    errors.description = "イベント概要を入力してください";
  if (!data.date) errors.date = "開催日を選択してください";
  if (!data.startTime) errors.startTime = "開始時刻を入力してください";
  if (data.date && data.startTime) {
    const startTs = toJstTimestamp(data.date, data.startTime);
    if (startTs == null) {
      errors.startTime = "開始時刻の形式が正しくありません";
    } else if (startTs < Date.now()) {
      errors.startTime = "開始日時が過去になっています";
    }
  }
  if (data.endTime && data.startTime) {
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm))
      errors.endTime = "終了時刻は開始時刻より後にしてください";
  }
  if (!data.location.trim()) errors.location = "開催場所を入力してください";
  if (!data.address.trim()) errors.address = "住所を入力してください";
  if (data.price < 0) errors.price = "料金は0以上で入力してください";
  if (!data.organizerName?.trim())
    errors.organizerName = "主催者名を入力してください";
  if (
    data.recurrence &&
    data.recurrence !== "none" &&
    (!data.recurrenceCount || data.recurrenceCount < 2)
  ) {
    errors.recurrenceCount = "繰り返し回数を選択してください";
  }
  return errors;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function EditPcStepBar({
  current,
  onGo,
  onBack,
  onSave,
  submitting,
  statusLabel,
  backLabelOverride,
}: {
  current: EventFormStep;
  onGo: (s: EventFormStep) => void;
  onBack: () => void;
  onSave: () => void;
  submitting: boolean;
  statusLabel: string;
  backLabelOverride?: string;
}) {
  const backLabels: Record<EventFormStep, string> = {
    1: "イベント一覧へ",
    2: "基本情報に戻る",
    3: "開催情報に戻る",
    4: "詳細情報に戻る",
  };
  const backLabel = backLabelOverride ?? backLabels[current];

  return (
    <header className="z-10 hidden shrink-0 border-b border-[#d8d4cc] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:block">
      <div className="flex items-center gap-4 px-6 py-1.5">
        <button
          type="button"
          onClick={onBack}
          className="flex w-[9rem] shrink-0 items-center gap-1 text-left text-[11px] font-medium text-[#4a4844] hover:text-[#2B3A6B]"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="truncate">{backLabel}</span>
        </button>
        <EventFormPcStepIndicator
          current={current}
          onGo={onGo}
          finalLabel="確認・保存"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edeae4] bg-[#fafaf8] px-6 py-1.5">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-full border border-[#d0ccc4] bg-white px-3 py-1 text-[11px] text-[#5c5a54]">
          <span className="text-[#888]">状態</span>
          <strong className="font-semibold text-[#1a1a1a]">{statusLabel}</strong>
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href="/organizer/events"
            className="rounded-[8px] border border-[#d0ccc4] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0]"
          >
            一覧へ戻る
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={submitting}
            className="min-w-[6rem] rounded-[8px] bg-[#2B3A6B] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#243159] disabled:opacity-50"
          >
            {submitting ? "保存中…" : "変更を保存"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const formTopRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventFormData | null>(null);
  const [itemsInput, setItemsInput] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState<EventFormStep>(1);
  const [showPassSettings, setShowPassSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.replace("/organizer/events");
        return;
      }
      const data = await res.json();
      setEvent(data);
      setForm(eventToForm(data));
      setItemsInput(
        Array.isArray(data.itemsToBring) ? data.itemsToBring.join("、") : ""
      );
    } catch {
      router.replace("/organizer/events");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    if (name === "price") {
      setForm((prev) =>
        prev ? { ...prev, [name]: parseInt(value, 10) || 0 } : prev
      );
    } else if (name === "prefecture") {
      setForm((prev) =>
        prev ? { ...prev, prefecture: value, city: "" } : prev
      );
    } else {
      setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
    }
  };

  const handleItemsBlur = () => {
    if (itemsInput.trim() && form) {
      const items = itemsInput
        .split(/[,、\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      setForm((prev) => (prev ? { ...prev, itemsToBring: items } : prev));
      setItemsInput(items.join("、"));
    }
  };

  const saveChanges = async () => {
    if (!form || !id) return;
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizer/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "更新に失敗しました");
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      setSubmitSuccess(true);
      const updated = await res.json();
      setEvent(updated);
      setForm(eventToForm(updated));
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setSubmitError("通信に失敗しました");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/organizer/events/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "削除に失敗しました");
        setDeleteConfirm(false);
        return;
      }
      router.replace("/organizer/events");
    } catch {
      setSubmitError("削除に失敗しました");
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="space-y-6 pb-24 min-[900px]:pb-0">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  const todayJst = getJstTodayYmd();
  const nowJstHm = getJstNowHm();
  const startTimeMin = form.date === todayJst ? nowJstHm : undefined;
  const statusLabel =
    STATUS_LABELS[event?.status ?? ""] ?? (event?.status || "下書き");

  const goToStep = (s: EventFormStep) => {
    setShowPassSettings(false);
    setCurrentStep(s);
  };
  const goNext = () => {
    setShowPassSettings(false);
    if (currentStep < 4) setCurrentStep((s) => (s + 1) as EventFormStep);
  };
  const goPrev = () => {
    if (showPassSettings) {
      setShowPassSettings(false);
      return;
    }
    if (currentStep === 1) router.push("/organizer/events");
    else setCurrentStep((s) => (s - 1) as EventFormStep);
  };

  const stepLabels: Record<EventFormStep, string> = {
    1: "基本情報",
    2: "開催情報",
    3: "詳細情報",
    4: "確認・保存",
  };
  const nextLabels: Record<EventFormStep, string> = {
    1: "開催情報へ",
    2: "詳細情報へ",
    3: "確認・保存へ",
    4: "",
  };

  const selectedTagLabels =
    (form.tags ?? [])
      .map((tagId) => EVENT_TAGS.find((t) => t.id === tagId)?.label ?? tagId)
      .join("、") || "—";
  const dateStr =
    form.date && form.startTime
      ? formatEventScheduleLabel(
          form.date,
          form.startTime,
          form.endTime || undefined,
          form.recurrence ?? "none",
          form.recurrenceCount
        )
      : "—";
  const missingRequired =
    !form.location.trim() ||
    !form.address.trim() ||
    !form.date ||
    !form.startTime ||
    !form.title.trim() ||
    !form.description.trim() ||
    !form.organizerName?.trim();

  return (
    <div
      ref={formTopRef}
      className="relative z-[1] flex flex-col min-[900px]:-mx-8 min-[900px]:flex min-[900px]:min-h-[calc(100dvh-var(--mg-pc-top-nav-h,52px)-5rem)] min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:bg-white"
    >
      <EditPcStepBar
        current={currentStep}
        onGo={goToStep}
        onBack={goPrev}
        onSave={saveChanges}
        submitting={submitting}
        statusLabel={statusLabel}
        backLabelOverride={showPassSettings ? "詳細情報に戻る" : undefined}
      />

      <div className="sticky top-0 z-10 -mx-4 border-b border-[#e8e6e0] bg-white sm:-mx-6 min-[900px]:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EF]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="flex-1 truncate text-[13px] font-[600]">
            {showPassSettings
              ? "参加パス設定"
              : currentStep === 1
                ? "イベントを編集"
                : `${stepLabels[currentStep]}を入力`}
          </div>
          <button
            type="button"
            onClick={saveChanges}
            disabled={submitting}
            className="shrink-0 rounded-[8px] bg-[#2B3A6B] px-2.5 py-1 text-[11px] font-[500] text-white disabled:opacity-50"
          >
            {submitting ? "保存中…" : "保存"}
          </button>
        </div>
        <div className="flex items-center px-3 pb-2">
          {!showPassSettings ? (
            <EventFormStepIndicator current={currentStep} onGo={goToStep} />
          ) : null}
        </div>
      </div>

      {toast && (
        <div
          className="mx-4 mt-3 min-[900px]:mx-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {toast}
        </div>
      )}
      {submitSuccess && (
        <div
          className="mx-4 mt-3 min-[900px]:mx-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          保存しました
        </div>
      )}
      {submitError && (
        <div
          className="mx-4 mt-3 min-[900px]:mx-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col min-[900px]:flex-row min-[900px]:overflow-hidden min-[900px]:bg-white min-[900px]:border-t min-[900px]:border-[#e8e6e0]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:overflow-hidden min-[900px]:bg-white">
          {showPassSettings && currentStep === 3 ? (
            <PassSettingsPcView
              form={form}
              onCancel={() => setShowPassSettings(false)}
              onEditEventInfo={() => {
                setShowPassSettings(false);
                setCurrentStep(2);
              }}
              onSave={async (next) => {
                const nextForm = form
                  ? {
                      ...form,
                      participationMode: next.participationMode,
                      paymentMethod: next.paymentMethod,
                      checkInMethod: next.checkInMethod,
                      passConfigured: next.passConfigured,
                      requiresRegistration: next.requiresRegistration,
                    }
                  : null;
                if (!nextForm || !id) return;
                setForm(nextForm);
                setSubmitError(null);
                try {
                  const res = await fetch(`/api/organizer/events/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...nextForm,
                      imageUrl: nextForm.imageUrl?.trim() || undefined,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setSubmitError(
                      typeof data.error === "string"
                        ? data.error
                        : "参加パス設定の保存に失敗しました"
                    );
                    return;
                  }
                  setEvent(data);
                  setForm(eventToForm(data));
                  setShowPassSettings(false);
                  setToast("参加パス設定を保存しました");
                  setTimeout(() => setToast(null), 2600);
                } catch {
                  setSubmitError("参加パス設定の保存に失敗しました");
                }
              }}
            />
          ) : null}

          {currentStep < 4 && !showPassSettings && (
            <div className="contents">
              <EventFormStepContent
                currentStep={currentStep}
                form={form}
                errors={errors}
                itemsInput={itemsInput}
                setItemsInput={setItemsInput}
                handleChange={handleChange}
                handleItemsBlur={handleItemsBlur}
                setForm={
                  setForm as React.Dispatch<React.SetStateAction<EventFormData>>
                }
                todayJst={todayJst}
                startTimeMin={startTimeMin}
                eventId={id}
                onOpenPassSettings={() => {
                  setCurrentStep(3);
                  setShowPassSettings(true);
                }}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="p-4 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden min-[900px]:p-0">
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">
                    基本情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-[12px] font-[500] text-[#2B3A6B]"
                  >
                    編集
                  </button>
                </div>
                {[
                  { label: "イベント名", val: form.title || null },
                  { label: "概要", val: form.description || null },
                  { label: "主催者名", val: form.organizerName || null },
                  { label: "連絡先", val: form.organizerContact || null },
                  {
                    label: "タグ",
                    val: selectedTagLabels !== "—" ? selectedTagLabels : null,
                  },
                  { label: "画像", val: form.imageUrl ? "設定済み" : null },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0"
                  >
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">
                      {label}
                    </span>
                    <span
                      className="flex-1 text-right text-[13px] leading-[1.5]"
                      style={{
                        color: val ? "#1a1a1a" : "#ccc",
                        fontWeight: val ? 500 : 400,
                      }}
                    >
                      {val ?? "未入力"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">
                    開催情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-[12px] font-[500] text-[#2B3A6B]"
                  >
                    編集
                  </button>
                </div>
                {[
                  { label: "開催日時", val: dateStr !== "—" ? dateStr : null },
                  ...(form.recurrence && form.recurrence !== "none"
                    ? [
                        {
                          label: "開催パターン",
                          val:
                            form.recurrence === "weekly"
                              ? `毎週開催（全${form.recurrenceCount ?? 4}回）`
                              : `毎月開催（全${form.recurrenceCount ?? 4}回）`,
                        },
                      ]
                    : []),
                  { label: "開催場所", val: form.location || null },
                  { label: "都道府県", val: form.prefecture || null },
                  {
                    label: "参加費",
                    val: `${form.price}円${form.price === 0 ? "（無料）" : ""}`,
                  },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0"
                  >
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">
                      {label}
                    </span>
                    <span
                      className="flex-1 text-right text-[13px] font-[500] leading-[1.5]"
                      style={{
                        color: val ? "#1a1a1a" : "#ccc",
                        fontWeight: val ? 500 : 400,
                      }}
                    >
                      {val ?? "未入力"}
                    </span>
                  </div>
                ))}
                <div className="mt-[20px] mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">
                    詳細情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="text-[12px] font-[500] text-[#2B3A6B]"
                  >
                    編集
                  </button>
                </div>
                {[
                  {
                    label: "定員",
                    val: form.capacity ? `${form.capacity}人` : "未設定（無制限）",
                  },
                  {
                    label: "締め切り",
                    val: form.registrationDeadline
                      ? new Date(form.registrationDeadline).toLocaleDateString("ja-JP")
                      : null,
                  },
                  {
                    label: "持ち物",
                    val: form.itemsToBring?.length
                      ? form.itemsToBring.join("、")
                      : null,
                  },
                  { label: "備考", val: form.registrationNote || null },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0"
                  >
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">
                      {label}
                    </span>
                    <span
                      className="flex-1 text-right text-[13px] leading-[1.5]"
                      style={{
                        color:
                          val && val !== "未設定（無制限）" ? "#1a1a1a" : "#999",
                        fontWeight:
                          val && val !== "未設定（無制限）" ? 500 : 400,
                      }}
                    >
                      {val ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6 pb-20 min-[900px]:pb-7">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.05em] text-[#888]">
                  保存の確認
                </div>
                {missingRequired && (
                  <div className="mb-[16px] flex gap-[9px] rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-[14px]">
                    <p className="text-[13px] leading-[1.6] text-[#c04060]">
                      必須項目が未入力です。保存する前に入力内容をご確認ください。
                    </p>
                  </div>
                )}
                <div className="mb-[16px] rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] p-[14px]">
                  <p className="text-[13px] leading-[1.7] text-[#555]">
                    現在の状態：
                    <strong className="ml-1 text-[#1a1a1a]">{statusLabel}</strong>
                  </p>
                  <p className="mt-2 text-[12px] text-[#888]">
                    公開・非公開の切り替えはイベント一覧から行えます
                  </p>
                  {event?.createdAt && (
                    <p className="mt-2 text-[12px] text-[#888]">
                      作成日：{formatDate(event.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-[7px]">
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={submitting || missingRequired}
                    className="w-full rounded-[9px] bg-[#2B3A6B] py-[12px] text-[14px] font-[600] text-white transition hover:bg-[#243159] disabled:opacity-50"
                  >
                    {submitting ? "保存中…" : "変更を保存"}
                  </button>
                  <Link
                    href={`/events/${id}`}
                    className="flex w-full items-center justify-center rounded-[9px] border border-[#e8e6e0] bg-white py-[12px] text-[14px] font-[500] text-[#1a1a1a] hover:bg-[#f5f4f0]"
                  >
                    詳細をプレビュー
                  </Link>
                  <Link
                    href={`/organizer?event=${encodeURIComponent(id)}`}
                    className="flex w-full items-center justify-center rounded-[9px] border border-[#2D7A4F] bg-[#EAF4ED] py-[12px] text-[14px] font-[500] text-[#2D7A4F] hover:bg-[#D0ECD7]"
                  >
                    当日管理へ →
                  </Link>
                </div>

                <div className="mt-6 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-4">
                  <p className="text-[13px] font-[600] text-[#1a1a1a]">危険な操作</p>
                  <p className="mt-1 text-[12px] leading-[1.6] text-[#888]">
                    イベントを削除すると元に戻せません。
                  </p>
                  {!deleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="mt-3 rounded-[8px] border border-[#E8708A] bg-white px-3 py-1.5 text-[12px] font-medium text-[#c04060] hover:bg-[#fff5f7]"
                    >
                      削除する
                    </button>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-[8px] bg-[#E8708A] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                      >
                        {deleting ? "削除中…" : "本当に削除する"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        disabled={deleting}
                        className="rounded-[8px] border border-[#e8e6e0] bg-white px-3 py-1.5 text-[12px] text-[#555]"
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {currentStep < 4 && !showPassSettings && (
          <EventFormSidePanel
            form={form}
            currentStep={currentStep}
            onNext={goNext}
            onPrev={goPrev}
            nextLabel={nextLabels[currentStep]}
          />
        )}
      </div>

      {currentStep < 4 && !showPassSettings && (
        <div className="sticky bottom-0 z-10 shrink-0 -mx-4 flex items-center justify-between border-t border-[#e8e6e0] bg-white px-3 py-1.5 sm:-mx-6 min-[900px]:hidden">
          <button
            type="button"
            onClick={goPrev}
            className="flex items-center gap-1 rounded-[9px] border border-[#e8e6e0] bg-white px-3 py-2 text-[13px] font-[500] min-[900px]:gap-[6px] min-[900px]:px-5 min-[900px]:py-[9px]"
            style={{ visibility: currentStep === 1 ? "hidden" : "visible" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </button>
          <div className="hidden min-[900px]:block text-center text-[12px] text-[#888]">
            STEP {currentStep} / 4 — {stepLabels[currentStep]}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1 rounded-[9px] border-none bg-[#2B3A6B] px-4 py-2 text-[13px] font-[600] text-white min-[900px]:gap-[6px] min-[900px]:px-6 min-[900px]:py-[9px]"
          >
            {nextLabels[currentStep]}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
      {currentStep === 4 && (
        <div className="min-[900px]:hidden sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-4 py-2 flex gap-[8px]">
          <button
            type="button"
            onClick={goPrev}
            className="flex items-center rounded-[10px] border border-[#e8e6e0] bg-white px-[18px] py-[11px] text-[13px] font-[500]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={submitting || missingRequired}
            className="flex flex-1 items-center justify-center gap-[6px] rounded-[10px] bg-[#2B3A6B] py-[11px] text-[13px] font-[600] text-white disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {submitting ? "保存中…" : "変更を保存"}
          </button>
        </div>
      )}
    </div>
  );
}
