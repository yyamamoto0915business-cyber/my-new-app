"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { cn } from "@/lib/utils";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormStepContent } from "@/components/organizer/events/EventFormStepContent";
import { PassSettingsPcView } from "@/components/organizer/events/PassSettingsPcView";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { getJstNowHm, getJstTodayYmd, toJstTimestamp } from "@/lib/jst-date";
import {
  EventFormPcStepIndicator,
  EventFormSidePanel,
  type EventFormStep,
} from "@/components/organizer/events/event-form-ui";
import { validateOnlineEventFormFields } from "@/lib/event-online-validation";

type FormErrors = Partial<Record<keyof EventFormData, string>>;

const STATUS_LABELS: Record<string, string> = {
  published: "公開中",
  draft: "下書き",
};

/** 保存に要る項目の名前（スマホの確認画面で、足りないものを出す） */
const EDIT_FIELD_LABEL: Partial<Record<keyof EventFormData, string>> = {
  title: "イベント名",
  description: "イベント概要",
  organizerName: "主催者名",
  date: "開催日",
  startTime: "開始時刻",
  endTime: "終了時刻",
  location: "開催場所",
  address: "住所",
  prefecture: "都道府県",
  recurrenceCount: "繰り返し回数",
  endDate: "終了日",
  price: "参加費",
};

/** その項目がどのステップにあるか（書いていないものは開催情報） */
const EDIT_FIELD_STEP: Partial<Record<keyof EventFormData, EventFormStep>> = {
  title: 1,
  description: 1,
  organizerName: 1,
  organizerContact: 1,
};

/** 読みこんだときの日程（変えていなければ「過去の日時」は問わない。サーバーも日程を変えたときだけ確かめる） */
type OriginalSchedule = { date?: string | null; startTime?: string | null } | null | undefined;

function validateForm(data: EventFormData, original?: OriginalSchedule): FormErrors {
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
    } else if (
      startTs < Date.now() &&
      // 開催中・終わったイベントでも、日程を変えていなければ保存できる（前はここで止まって「変更を保存」が押せなかった）
      !(original &&
        (original.date ?? "").slice(0, 10) === data.date.slice(0, 10) &&
        (original.startTime ?? "").slice(0, 5) === data.startTime.slice(0, 5))
    ) {
      errors.startTime = "開始日時が過去になっています";
    }
  }
  if (data.endTime && data.startTime) {
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm))
      errors.endTime = "終了時刻は開始時刻より後にしてください";
  }
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
  if (data.endDate && data.date && data.endDate < data.date) {
    errors.endDate = "終了日は開始日より後の日付にしてください";
  }
  const onlineErrors = validateOnlineEventFormFields({
    eventFormat: data.eventFormat,
    onlineService: data.onlineService,
    onlineJoinUrl: data.onlineJoinUrl,
    onlineGuideMessage: data.onlineGuideMessage,
    onlineLinkDisplayTiming: data.onlineLinkDisplayTiming,
    location: data.location,
    address: data.address,
    startTime: data.startTime,
  });
  Object.assign(errors, onlineErrors as FormErrors);
  return errors;
}

/** 下書きで確かめるのは「イベント名・開催日・開始時刻」と、入れた値の形だけ（足りない分は公開のときに確かめる） */
const DRAFT_CHECK_KEYS: (keyof EventFormData)[] = ["title", "date", "startTime", "endTime", "price", "recurrenceCount", "endDate"];
function validateDraft(data: EventFormData, original?: OriginalSchedule): FormErrors {
  const all = validateForm(data, original);
  const errors: FormErrors = {};
  for (const key of DRAFT_CHECK_KEYS) if (all[key]) errors[key] = all[key];
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
    1: "確認に戻る",
    2: "確認に戻る",
    3: "確認に戻る",
    4: "イベント一覧へ",
  };
  const backLabel = backLabelOverride ?? backLabels[current];

  return (
    <header className="z-10 hidden shrink-0 border-b border-[#d8d4cc] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:block">
      <div className="flex items-center gap-4 px-6 py-1.5">
        <button
          type="button"
          onClick={onBack}
          className="flex w-[9rem] shrink-0 items-center gap-1 text-left text-[11px] font-medium text-[#4a4844] hover:text-[#173f2c]"
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
            className="min-w-[6rem] rounded-[8px] bg-[#173f2c] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0e2a1d] disabled:opacity-50"
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
  // 今あるイベントの編集は、全体が見える「確認」から開き、直したい所の「編集」から各ステップへ行く
  const [currentStep, setCurrentStep] = useState<EventFormStep>(4);
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

  const saveChanges = async (): Promise<boolean> => {
    if (!form || !id) return false;
    // 下書きは、足りない項目があっても保存できる（公開するときに確かめる）
    const formErrors = event?.status === "draft" ? validateDraft(form, event) : validateForm(form, event);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
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
        return false;
      }
      setSubmitSuccess(true);
      const updated = await res.json();
      setEvent(updated);
      setForm(eventToForm(updated));
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    } catch {
      setSubmitError("通信に失敗しました");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
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
  /** 足りない項目のステップへ移って、その入力欄へ */
  const goToField = (field: keyof EventFormData) => {
    goToStep(EDIT_FIELD_STEP[field] ?? 2);
    window.setTimeout(() => {
      const root = formTopRef.current;
      if (!root) return;
      const el = Array.from(root.querySelectorAll<HTMLElement>(`[name="${String(field)}"]`)).find(
        (n) => n.offsetParent !== null
      );
      if (!el) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }, 120);
  };
  const goNext = () => {
    setShowPassSettings(false);
    if (currentStep < 4) setCurrentStep((s) => (s + 1) as EventFormStep);
  };
  /** 保存していない変更があるか（読みこんだ・保存した内容とくらべる） */
  const dirty = event ? JSON.stringify(form) !== JSON.stringify(eventToForm(event)) : false;
  const goPrev = () => {
    if (showPassSettings) {
      setShowPassSettings(false);
      return;
    }
    // 内容の一覧からは一覧へ、各部分からは内容の一覧へ戻る（入れた内容はそのまま残る）
    if (currentStep === 4) {
      if (dirty && !window.confirm("保存していない変更があります。保存せずに戻りますか？")) return;
      router.push("/organizer/events");
    } else setCurrentStep(4);
  };
  /** スマホ：部分の編集から保存して、内容の一覧に戻る */
  const saveAndBack = async () => {
    if (await saveChanges()) setCurrentStep(4);
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
          form.recurrenceCount,
          form.endDate
        )
      : "—";
  const isDraftEvent = event?.status === "draft";
  const saveErrors = isDraftEvent ? validateDraft(form, event) : validateForm(form, event);
  const missingRequired = Object.keys(saveErrors).length > 0;
  /** 下書きで、公開に足りない項目が残っている */
  const missingForPublishing = isDraftEvent && Object.keys(validateForm(form, event)).length > 0;
  /** 保存できない理由（足りない項目）。スマホの確認画面で、押せない保存ボタンの代わりに出す */
  const missingFields = (Object.keys(saveErrors) as (keyof EventFormData)[]).filter(
    (k) => EDIT_FIELD_LABEL[k]
  );

  return (
    <div
      ref={formTopRef}
      data-event-form
      className="relative z-[1] flex min-w-0 flex-col min-[900px]:-mx-6 min-[900px]:flex min-[900px]:h-full min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:bg-white"
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

      <div className="sticky top-0 z-20 -mx-4 border-b border-[#e8e6e0] bg-white pt-[env(safe-area-inset-top,0px)] sm:-mx-6 min-[900px]:hidden">
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
          <div className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#173f2c]">
            {showPassSettings
              ? "参加パス設定"
              : currentStep === 4
                ? "イベントを編集"
                : `${stepLabels[currentStep]}を編集`}
          </div>
          {/* 編集はステップで進まないので、ステップの表示と上の保存は出さない（保存は下の1つだけ） */}
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold",
              event?.status === "published" ? "bg-[#e3f2e7] text-[#1f7a4a]" : event?.status === "draft" ? "bg-[#fdf1d8] text-[#a26a10]" : "bg-[#eef0ec] text-[#6b776f]"
            )}
          >
            {statusLabel}
          </span>
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
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7 max-[899px]:mb-3 max-[899px]:rounded-[16px] max-[899px]:border max-[899px]:border-[#e6e2d6] max-[899px]:bg-white max-[899px]:px-4 max-[899px]:pt-3 max-[899px]:pb-2 max-[899px]:shadow-[0_1px_4px_rgba(23,63,44,0.05)]">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888] max-[899px]:text-[14px] max-[899px]:font-bold max-[899px]:text-[#173f2c]">
                    基本情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-[12px] font-[500] text-[#173f2c] max-[899px]:min-h-[34px] max-[899px]:rounded-full max-[899px]:border max-[899px]:border-[#e1d6b4] max-[899px]:px-3.5 max-[899px]:font-bold"
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

              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7 max-[899px]:mb-3 max-[899px]:rounded-[16px] max-[899px]:border max-[899px]:border-[#e6e2d6] max-[899px]:bg-white max-[899px]:px-4 max-[899px]:pt-3 max-[899px]:pb-2 max-[899px]:shadow-[0_1px_4px_rgba(23,63,44,0.05)]">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888] max-[899px]:text-[14px] max-[899px]:font-bold max-[899px]:text-[#173f2c]">
                    開催情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-[12px] font-[500] text-[#173f2c] max-[899px]:min-h-[34px] max-[899px]:rounded-full max-[899px]:border max-[899px]:border-[#e1d6b4] max-[899px]:px-3.5 max-[899px]:font-bold"
                  >
                    編集
                  </button>
                </div>
                {[
                  { label: "開催日時", val: dateStr !== "—" ? dateStr : null },
                  ...(form.endDate && form.endDate > form.date
                    ? [{ label: "開催パターン", val: "期間（毎日開催）" }]
                    : []),
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
                {event?.status === "published" ? (
                  <p className="mt-1 rounded-[10px] bg-[#f7f6f2] px-3 py-2 text-[11.5px] leading-relaxed text-[#6b776f]">
                    公開済みのイベントは、日程（日付・時刻）を変えられません。変えるときは、複製して新しいイベントとして作ってください。
                  </p>
                ) : null}
                <div className="mt-[20px] mb-[10px] flex items-center justify-between max-[899px]:-mx-4 max-[899px]:mt-3 max-[899px]:border-t-[10px] max-[899px]:border-[#f7f6f2] max-[899px]:px-4 max-[899px]:pt-3">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888] max-[899px]:text-[14px] max-[899px]:font-bold max-[899px]:text-[#173f2c]">
                    詳細情報
                  </span>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="text-[12px] font-[500] text-[#173f2c] max-[899px]:min-h-[34px] max-[899px]:rounded-full max-[899px]:border max-[899px]:border-[#e1d6b4] max-[899px]:px-3.5 max-[899px]:font-bold"
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
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.05em] text-[#888] max-[899px]:hidden">
                  保存の確認
                </div>
                {missingRequired && (
                  <div className="mb-[16px] flex gap-[9px] rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-[14px]">
                    <p className="text-[13px] leading-[1.6] text-[#c04060]">
                      必須項目が未入力です。保存する前に入力内容をご確認ください。
                    </p>
                  </div>
                )}
                {!missingRequired && missingForPublishing && (
                  <div className="mb-[16px] flex gap-[9px] rounded-[10px] border border-[#ecdcab] bg-[#fbf7ea] p-[14px]">
                    <p className="text-[13px] leading-[1.6] text-[#7a5f1f]">
                      まだ入っていない項目があります。下書きのまま保存できますが、公開するときには入れてください。
                    </p>
                  </div>
                )}
                <div className="mb-[16px] rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] p-[14px]">
                  <p className="text-[13px] leading-[1.7] text-[#555]">
                    現在の状態：
                    <strong className="ml-1 text-[#1a1a1a]">{statusLabel}</strong>
                  </p>
                  <p className="mt-2 text-[12px] text-[#888]">
                    公開・非公開の切り替えは掲載管理から行えます
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
                    className="w-full rounded-[9px] bg-[#173f2c] py-[12px] text-[14px] font-[600] text-white transition hover:bg-[#0e2a1d] disabled:opacity-50 max-[899px]:hidden"
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
                    className="flex w-full items-center justify-center rounded-[9px] border border-[#2D7A4F] bg-[#EAF4ED] py-[12px] text-[14px] font-[500] text-[#2D7A4F] hover:bg-[#D0ECD7] max-[899px]:hidden"
                  >
                    当日管理へ →
                  </Link>
                  <Link
                    href={`/organizer/events/${encodeURIComponent(id)}/answers`}
                    className="flex w-full items-center justify-center rounded-[9px] border border-[#e8e6e0] bg-white py-[12px] text-[14px] font-[500] text-[#1a1a1a] hover:bg-[#f5f4f0] max-[899px]:hidden"
                  >
                    申し込みと答えを見る
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
        <div className="sticky bottom-0 z-10 -mx-4 flex shrink-0 items-center justify-between gap-2 border-t border-[#e8e6e0] bg-white px-3 py-2 sm:-mx-6 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] min-[900px]:hidden">
          <button
            type="button"
            onClick={goPrev}
            className="flex min-h-[44px] items-center gap-1 rounded-[12px] border border-[#e8e6e0] bg-white px-3 py-2 text-[13px] font-[500]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            内容にもどる
          </button>
          {/* 部分ごとの編集なので「次へ」ではなく、保存してもどる */}
          <button
            type="button"
            onClick={() => void saveAndBack()}
            disabled={submitting}
            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1 rounded-[12px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] px-5 py-2 text-[14px] font-[700] text-[#f6ebc8] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {submitting ? "保存中…" : "保存してもどる"}
          </button>
        </div>
      )}
      {currentStep === 4 && (
        <div className="min-[900px]:hidden sticky bottom-0 z-10 -mx-4 flex gap-[8px] border-t border-[#e8e6e0] bg-white px-3 py-2 sm:-mx-6 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {missingRequired && missingFields.length > 0 ? (
            // 前は灰色で押せないだけで、何が足りないのか分からなかった
            <button
              type="button"
              onClick={() => goToField(missingFields[0])}
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[10px] border border-[#f0c2aa] bg-[#fff7f2] px-2 py-[6px] text-[#a8481c]"
            >
              <span className="max-w-full truncate text-[11px] font-semibold">
                {missingFields.length > 1 ? `あと${missingFields.length}か所直すと保存できます` : "ここを直すと保存できます"}
              </span>
              <span className="max-w-full truncate text-[13px] font-bold">
                {saveErrors[missingFields[0]] ?? `${EDIT_FIELD_LABEL[missingFields[0]]}を入れる`} ›
              </span>
            </button>
          ) : (
          dirty || submitting ? (
          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={submitting || missingRequired}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-[6px] rounded-[12px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] py-[11px] text-[14px] font-[700] text-[#f6ebc8] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {submitting ? "保存中…" : "変更を保存"}
          </button>
          ) : (
            // 何も変えていないときは押せない形にして、保存したか迷わないようにする
            <div className="flex min-h-[46px] flex-1 items-center justify-center rounded-[12px] bg-[#f1f2ef] text-[13px] font-semibold text-[#8a958d]">
              {submitSuccess ? "保存しました" : "変更はありません"}
            </div>
          )
          )}
        </div>
      )}
    </div>
  );
}
