"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormStepContent } from "@/components/organizer/events/EventFormStepContent";
import { PassSettingsPcView } from "@/components/organizer/events/PassSettingsPcView";
import {
  EventFormPcStepIndicator,
  EventFormSidePanel,
  EventFormStepIndicator,
  type EventFormStep,
} from "@/components/organizer/events/event-form-ui";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { buildPlanSummary, type PlanSummary } from "@/lib/organizer-plan-summary";
import { getJstNowHm, getJstTodayYmd, toJstTimestamp } from "@/lib/jst-date";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { validateOnlineEventFormFields } from "@/lib/event-online-validation";

type Step = EventFormStep;
type FormErrors = Partial<Record<keyof EventFormData, string>>;

const initialForm: EventFormData = {
  title:"",imageUrl:"",description:"",date:"",startTime:"",endTime:"",
  location:"",address:"",price:0,priceNote:"",organizerName:"",organizerContact:"",
  rainPolicy:"",itemsToBring:[],access:"",childFriendly:false,prefecture:"",city:"",
  area:"",tags:[],sponsorTicketPrices:[],sponsorPerks:{},prioritySlots:0,
  englishGuideAvailable:false,capacity:undefined,requiresRegistration:false,
  participationMode:"none",paymentMethod:null,checkInMethod:null,passConfigured:false,
  registrationDeadline:undefined,registrationNote:undefined,
  recurrence:"none",recurrenceCount:null,
  eventFormat:"onsite",
  onlineService:null,
  onlineJoinUrl:"",
  onlineMeetingId:"",
  onlinePasscode:"",
  onlineGuideMessage:"",
  onlineLinkVisibility:"pass_holders_only",
  onlineLinkDisplayTiming:"15_minutes_before",
  publicPageLinkVisible:false,
};

function validateForm(data: EventFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = "イベント名を入力してください";
  if (!data.description.trim()) errors.description = "イベント概要を入力してください";
  if (!data.date) errors.date = "開催日を選択してください";
  if (!data.startTime) errors.startTime = "開始時刻を入力してください";
  if (data.date && data.startTime) {
    const startTs = toJstTimestamp(data.date, data.startTime);
    if (startTs == null) errors.startTime = "開始時刻の形式が正しくありません";
    else if (startTs < Date.now()) errors.startTime = "開始日時が過去になっています";
  }
  if (data.endTime && data.startTime) {
    const [sh,sm] = data.startTime.split(":").map(Number);
    const [eh,em] = data.endTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm)) errors.endTime = "終了時刻は開始時刻より後にしてください";
  }
  if (data.price < 0) errors.price = "料金は0以上で入力してください";
  if (!data.organizerName?.trim()) errors.organizerName = "主催者名を入力してください";
  if (data.recurrence && data.recurrence !== "none" && (!data.recurrenceCount || data.recurrenceCount < 2)) {
    errors.recurrenceCount = "繰り返し回数を選択してください";
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

// ── PC step bar ──
function PcStepBar({
  current, onGo, onBack, onDraft, onPublish, submitting, planSummary, publishDisabledReason, backLabelOverride,
}: {
  current: Step; onGo: (s: Step) => void; onBack: () => void;
  onDraft: () => void; onPublish: () => void;
  submitting: null | "draft" | "publish";
  planSummary: PlanSummary | null;
  publishDisabledReason: null | "required_missing" | "no_slots";
  backLabelOverride?: string;
}) {
  const backLabel = backLabelOverride ?? (current === 1 ? "イベント一覧へ" : ["","基本情報に戻る","開催情報に戻る","詳細情報に戻る",""][current]);
  const planLabel = planSummary
    ? planSummary.publishLimit === null
      ? "公開枠 無制限"
      : `公開枠 ${planSummary.monthlyPublished}/${planSummary.publishLimit}件`
    : "";
  const planName = planSummary?.isFreePlan ? "Starterプラン" : "Proプラン";
  const canPublish = publishDisabledReason === null && !submitting;

  return (
    <header className="z-10 hidden shrink-0 border-b border-[#d8d4cc] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:block">
      {/* 1行目: 戻る + ステッパー */}
      <div className="flex items-center gap-4 px-6 py-1.5">
        <button
          type="button"
          onClick={onBack}
          className="flex w-[9rem] shrink-0 items-center gap-1 text-left text-[11px] font-medium text-[#4a4844] hover:text-[#2B3A6B]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          <span className="truncate">{backLabel}</span>
        </button>
        <EventFormPcStepIndicator current={current} onGo={onGo} />
      </div>

      {/* 2行目: プラン + アクション */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edeae4] bg-[#fafaf8] px-6 py-1.5">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-full border border-[#d0ccc4] bg-white px-3 py-1 text-[11px] text-[#5c5a54]">
          <strong className="font-semibold text-[#1a1a1a]">{planName}</strong>
          {planLabel && <span className="whitespace-nowrap">｜ {planLabel}</span>}
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href="/organizer/events"
            className="rounded-[8px] border border-[#d0ccc4] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0]"
          >
            キャンセル
          </Link>
          <button
            type="button"
            onClick={onDraft}
            disabled={!!submitting}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#d0ccc4] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0] disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            {submitting === "draft" ? "保存中…" : "下書き保存"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={!!submitting || publishDisabledReason !== null}
            className={[
              "min-w-[6rem] rounded-[8px] px-4 py-1.5 text-[11px] font-semibold transition",
              canPublish
                ? "bg-[#2B3A6B] text-white hover:bg-[#243159]"
                : "cursor-not-allowed bg-[#ebe8e2] text-[#8a8680]",
            ].join(" ")}
          >
            {submitting === "publish" ? "公開中…" : "公開する"}
          </button>
        </div>
      </div>
    </header>
  );
}

function NewEventPageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function NewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const formTopRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<EventFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [itemsInput, setItemsInput] = useState("");
  const [submitting, setSubmitting] = useState<null | "draft" | "publish">(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showPassSettings, setShowPassSettings] = useState(false);
  const { user } = useSupabaseUser();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (!copyFromId) return;
    let cancelled = false;
    (async () => {
      setCopyLoading(true);
      try {
        const res = await fetch(`/api/organizer/events/${copyFromId}`);
        const data = (await res.json()) as Event | { error?: string };
        if (cancelled) return;
        if (!res.ok || !data || typeof (data as Event).title !== "string") {
          setSubmitError("複製元のイベントを読み込めませんでした");
          return;
        }
        const ev = data as Event;
        setForm(eventToForm(ev));
        setItemsInput((ev.itemsToBring ?? []).join("、"));
      } catch {
        if (!cancelled) setSubmitError("複製元のイベントを読み込めませんでした");
      } finally {
        if (!cancelled) setCopyLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [copyFromId]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      if (!supabase) return;
      try {
        const { data } = await supabase.from("organizers")
          .select("organization_name, contact_email, contact_phone")
          .eq("profile_id", user.id).maybeSingle();
        if (cancelled || !data) return;
        const d = data as { organization_name?: string; contact_email?: string; contact_phone?: string };
        setForm(prev => ({
          ...prev,
          organizerName: prev.organizerName?.trim() ? prev.organizerName : (d.organization_name?.trim() ?? ""),
          organizerContact: prev.organizerContact?.trim() ? prev.organizerContact : (d.contact_email?.trim() || d.contact_phone?.trim() || ""),
        }));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing");
        const d = await res.json();
        if (!res.ok || cancelled) return;
        setPlanSummary(buildPlanSummary(
          {
            subscription_status: d.organizer?.subscription_status ?? null,
            stripe_status: d.organizer?.stripe_status ?? null,
            founder30_end_at: d.organizer?.founder30_end_at ?? null,
            manual_grant_active: d.organizer?.manual_grant_active ?? false,
            manual_grant_expires_at: d.organizer?.manual_grant_expires_at ?? null,
          },
          typeof d.monthlyPublished === "number" ? d.monthlyPublished : 0
        ));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "price") setForm(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    else if (name === "prefecture") setForm(prev => ({ ...prev, prefecture: value, city: "" }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleItemsBlur = () => {
    if (itemsInput.trim()) {
      const items = itemsInput.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);
      setForm(prev => ({ ...prev, itemsToBring: items }));
      setItemsInput(items.join("、"));
    }
  };

  const saveDraft = async () => {
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      return;
    }
    setErrors({}); setSubmitError(null); setSubmitting("draft");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...form, imageUrl: form.imageUrl?.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof data.error === "string" && data.error.trim() ? data.error : "作成に失敗しました");
        return;
      }
      showToast("success", "下書きを保存しました。イベント管理から編集できます");
      router.refresh();
      setTimeout(() => router.push("/organizer/events"), 350);
    } catch {
      setSubmitError("通信に失敗しました");
    } finally {
      setSubmitting(null);
    }
  };

  const publishEvent = async () => {
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors); setSubmitError("入力内容をご確認ください"); return;
    }
    setErrors({}); setSubmitError(null); setSubmitting("publish");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...form, imageUrl: form.imageUrl?.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof data.error === "string" && data.error.trim() ? data.error : "作成に失敗しました");
        return;
      }
      const eventId = typeof data.id === "string" ? data.id : null;
      if (!eventId) { setSubmitError("イベントIDを取得できませんでした"); return; }
      const pubRes = await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
      const pubJson = await pubRes.json().catch(() => ({}));
      if (!pubRes.ok) {
        if (pubRes.status === 402) { showToast("error", typeof pubJson?.error === "string" ? pubJson.error : "今月の公開枠を使い切っています"); return; }
        setSubmitError(typeof pubJson?.error === "string" ? pubJson.error : "公開に失敗しました");
        return;
      }
      showToast("success", "イベントを公開しました");
      router.refresh();
      setTimeout(() => router.push("/organizer/events"), 350);
    } catch {
      setSubmitError("通信に失敗しました");
    } finally {
      setSubmitting(null);
    }
  };

  const publishLimit = planSummary?.publishLimit ?? null;
  const hasPublishSlot = publishLimit === null ? true : (planSummary?.monthlyPublished ?? 0) < publishLimit;
  const publishDisabledReason: null | "required_missing" | "no_slots" = (() => {
    if (!hasPublishSlot) return "no_slots";
    if (Object.keys(validateForm(form)).length > 0) return "required_missing";
    return null;
  })();

  const todayJst = getJstTodayYmd();
  const nowJstHm = getJstNowHm();
  const startTimeMin = form.date === todayJst ? nowJstHm : undefined;

  const goToStep = (s: Step) => {
    setShowPassSettings(false);
    setCurrentStep(s);
  };
  const goNext = () => {
    setShowPassSettings(false);
    if (currentStep < 4) setCurrentStep(s => (s + 1) as Step);
  };
  const goPrev = () => {
    if (showPassSettings) {
      setShowPassSettings(false);
      return;
    }
    if (currentStep === 1) router.push("/organizer/events");
    else setCurrentStep(s => (s - 1) as Step);
  };

  const stepLabels: Record<Step, string> = { 1: "基本情報", 2: "開催情報", 3: "詳細情報", 4: "確認・公開" };
  const nextLabels: Record<Step, string> = { 1: "開催情報へ", 2: "詳細情報へ", 3: "確認・公開へ", 4: "" };

  // ── Confirm summary values ──
  const selectedTagLabels = (form.tags ?? []).map(id => EVENT_TAGS.find(t => t.id === id)?.label ?? id).join("、") || "—";
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
  const missingRequired = Object.keys(validateForm(form)).length > 0;

  return (
    <div
      ref={formTopRef}
      data-event-form
      className="relative z-[1] flex min-w-0 flex-col min-[900px]:-mx-6 min-[900px]:flex min-[900px]:h-full min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:bg-white"
    >

      {/* ── PC step bar ── */}
      <PcStepBar
        current={currentStep} onGo={goToStep} onBack={goPrev}
        backLabelOverride={showPassSettings ? "詳細情報に戻る" : undefined}
        onDraft={saveDraft} onPublish={() => { if (!agreedToTerms) { showToast("error","利用規約への同意が必要です"); return; } setShowPublishConfirm(true); }}
        submitting={submitting} planSummary={planSummary} publishDisabledReason={publishDisabledReason}
      />

      {/* ── Mobile header ── */}
      <div className="min-[900px]:hidden sticky top-0 z-10 -mx-4 border-b border-[#e8e6e0] bg-white sm:-mx-6">
        <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
          <button type="button" onClick={goPrev} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EF]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="flex-1 truncate text-[13px] font-[600]">
            {showPassSettings
              ? "参加パス設定"
              : currentStep === 1
                ? "新しいイベントを作成"
                : stepLabels[currentStep] + "を入力"}
          </div>
          <button type="button" onClick={saveDraft} disabled={!!submitting} className="shrink-0 rounded-[8px] bg-[#F3F2EF] px-2.5 py-1 text-[11px] font-[500] disabled:opacity-50">
            {submitting === "draft" ? "保存中…" : "下書き保存"}
          </button>
        </div>
        <div className="flex items-center px-4 pb-2 sm:px-6">
          {!showPassSettings ? (
            <EventFormStepIndicator current={currentStep} onGo={goToStep} />
          ) : null}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`mx-4 mt-3 min-[900px]:mx-6 rounded-xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
          {toast.message}
        </div>
      )}
      {copyLoading && <p className="mx-4 mt-3 text-sm text-[#888]">複製元の内容を読み込み中…</p>}
      {submitError && (
        <div className="mx-4 mt-3 min-[900px]:mx-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{submitError}</div>
      )}

      {/* ── Content area ── */}
      <div className="flex min-h-0 flex-1 flex-col min-[900px]:flex-row min-[900px]:overflow-hidden min-[900px]:bg-white min-[900px]:border-t min-[900px]:border-[#e8e6e0]">

        {/* Left/main panels */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:overflow-hidden min-[900px]:bg-white">

          {showPassSettings && currentStep === 3 ? (
            <PassSettingsPcView
              form={form}
              onCancel={() => setShowPassSettings(false)}
              onEditEventInfo={() => {
                setShowPassSettings(false);
                setCurrentStep(2);
              }}
              onSave={(next) => {
                setForm((prev) => ({
                  ...prev,
                  participationMode: next.participationMode,
                  paymentMethod: next.paymentMethod,
                  checkInMethod: next.checkInMethod,
                  passConfigured: next.passConfigured,
                  requiresRegistration: next.requiresRegistration,
                }));
                setShowPassSettings(false);
                showToast("success", "参加パス設定を保存しました");
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
                setForm={setForm}
                todayJst={todayJst}
                startTimeMin={startTimeMin}
                onOpenPassSettings={() => {
                  setCurrentStep(3);
                  setShowPassSettings(true);
                }}
              />
            </div>
          )}

          {/* ══ STEP 4: 確認・公開 ══ */}
          {currentStep === 4 && (
            <div className="p-4 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden min-[900px]:p-0">
              {/* 基本情報確認 */}
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">基本情報</span>
                  <button type="button" onClick={() => goToStep(1)} className="text-[12px] font-[500] text-[#2B3A6B]">編集</button>
                </div>
                {[
                  { label: "イベント名", val: form.title || null },
                  { label: "概要", val: form.description || null },
                  { label: "主催者名", val: form.organizerName || null },
                  { label: "連絡先", val: form.organizerContact || null },
                  { label: "タグ", val: selectedTagLabels !== "—" ? selectedTagLabels : null },
                  { label: "画像", val: form.imageUrl ? "設定済み" : null },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0">
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">{label}</span>
                    <span className="flex-1 text-right text-[13px] font-[500] leading-[1.5]" style={{ color: val ? "#1a1a1a" : "#ccc", fontWeight: val ? 500 : 400 }}>{val ?? "未入力"}</span>
                  </div>
                ))}
              </div>

              {/* 開催・詳細確認 */}
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] min-[900px]:p-6 pb-4 min-[900px]:pb-7">
                <div className="mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">開催情報</span>
                  <button type="button" onClick={() => goToStep(2)} className="text-[12px] font-[500] text-[#2B3A6B]">編集</button>
                </div>
                {[
                  { label: "開催日時", val: dateStr !== "—" ? dateStr : null },
                  ...(form.recurrence && form.recurrence !== "none"
                    ? [{
                        label: "開催パターン",
                        val: form.recurrence === "weekly"
                          ? `毎週開催（全${form.recurrenceCount ?? 4}回）`
                          : `毎月開催（全${form.recurrenceCount ?? 4}回）`,
                      }]
                    : []),
                  { label: "開催場所", val: form.location || null },
                  { label: "都道府県", val: form.prefecture || null },
                  { label: "参加費", val: `${form.price}円${form.price === 0 ? "（無料）" : ""}` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0">
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">{label}</span>
                    <span className="flex-1 text-right text-[13px] font-[500] leading-[1.5]" style={{ color: val ? "#1a1a1a" : "#ccc", fontWeight: val ? 500 : 400 }}>{val ?? "未入力"}</span>
                  </div>
                ))}
                <div className="mt-[20px] mb-[10px] flex items-center justify-between">
                  <span className="text-[12px] font-[600] tracking-[.05em] text-[#888]">詳細情報</span>
                  <button type="button" onClick={() => goToStep(3)} className="text-[12px] font-[500] text-[#2B3A6B]">編集</button>
                </div>
                {[
                  { label: "定員", val: form.capacity ? `${form.capacity}人` : "未設定（無制限）" },
                  { label: "締め切り", val: form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleDateString("ja-JP") : null },
                  { label: "持ち物", val: form.itemsToBring?.length ? form.itemsToBring.join("、") : null },
                  { label: "備考", val: form.registrationNote || null },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[9px] last:border-b-0">
                    <span className="w-[90px] shrink-0 text-[12px] text-[#888]">{label}</span>
                    <span className="flex-1 text-right text-[13px] leading-[1.5]" style={{ color: val && val !== "未設定（無制限）" ? "#1a1a1a" : "#999", fontWeight: val && val !== "未設定（無制限）" ? 500 : 400 }}>{val ?? "—"}</span>
                  </div>
                ))}
              </div>

              {/* 公開アクション */}
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6 pb-20 min-[900px]:pb-7">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.05em] text-[#888]">公開の確認</div>
                {missingRequired && (
                  <div className="mb-[16px] flex gap-[9px] rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-[14px]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8708A" strokeWidth="2" strokeLinecap="round" className="mt-[1px] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-[13px] leading-[1.6] text-[#c04060]">必須項目が未入力です。公開するにはすべての必須項目を入力してください。</p>
                  </div>
                )}
                <div className="mb-[16px] rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] p-[14px]">
                  <p className="mb-[8px] text-[13px] leading-[1.7] text-[#555]">
                    保存は下書きとして行われます。
                    <br />
                    下書きは「イベント管理」から編集できます。
                  </p>
                  <label className="flex cursor-pointer items-start gap-[6px]">
                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-[2px]" style={{ accentColor: "#2B3A6B" }} />
                    <span className="text-[13px] leading-[1.5] text-[#555]">掲載内容の責任を理解し、<Link href="/terms" target="_blank" className="text-[#c8a84b]">利用規約</Link>に同意する</span>
                  </label>
                </div>
                <div className="flex flex-col gap-[7px]">
                  <button type="button" onClick={saveDraft} disabled={!!submitting} className="w-full rounded-[9px] border border-[#e8e6e0] bg-white py-[12px] text-[14px] font-[500] hover:bg-[#f5f4f0] disabled:opacity-50">
                    {submitting === "draft" ? "保存中…" : "下書き保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!agreedToTerms) { showToast("error","利用規約への同意が必要です"); return; } if (missingRequired) { showToast("error","必須項目を入力してください"); return; } setShowPublishConfirm(true); }}
                    disabled={!!submitting}
                    className="w-full rounded-[9px] py-[12px] text-[14px] font-[600] text-white transition disabled:opacity-50"
                    style={{ background: !missingRequired && agreedToTerms ? "#6BBF3E" : "#bbb" }}
                  >
                    {submitting === "publish" ? "公開中…" : "公開する"}
                  </button>
                </div>
                <p className="mt-[10px] text-center text-[12px] text-[#888]">下書きは「イベント管理」から編集できます</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel (PC, steps 1–3) ── */}
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

      {/* ── Footer nav (mobile step 1–3) ── */}
      {currentStep < 4 && !showPassSettings && (
        <div className="sticky bottom-0 z-10 shrink-0 -mx-4 flex items-center justify-between border-t border-[#e8e6e0] bg-white px-3 py-1.5 sm:-mx-6 min-[900px]:hidden">
          <button type="button" onClick={goPrev} className="flex items-center gap-1 rounded-[9px] border border-[#e8e6e0] bg-white px-3 py-2 text-[13px] font-[500] min-[900px]:gap-[6px] min-[900px]:px-5 min-[900px]:py-[9px]" style={{ visibility: currentStep === 1 ? "hidden" : "visible" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </button>
          <div className="hidden min-[900px]:block text-center text-[12px] text-[#888]">STEP {currentStep} / 4 — {stepLabels[currentStep]}</div>
          <button type="button" onClick={goNext} className="flex items-center gap-1 rounded-[9px] border-none bg-[#2B3A6B] px-4 py-2 text-[13px] font-[600] text-white min-[900px]:gap-[6px] min-[900px]:px-6 min-[900px]:py-[9px]">
            {nextLabels[currentStep]}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
      {currentStep === 4 && (
        <div className="min-[900px]:hidden sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-4 py-2 flex gap-[8px]">
          <button type="button" onClick={goPrev} className="flex items-center rounded-[10px] border border-[#e8e6e0] bg-white px-[18px] py-[11px] text-[13px] font-[500]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </button>
          <button
            type="button"
            onClick={() => { if (!agreedToTerms) { showToast("error","利用規約への同意が必要です"); return; } if (missingRequired) { showToast("error","必須項目を入力してください"); return; } setShowPublishConfirm(true); }}
            disabled={!!submitting}
            className="flex flex-1 items-center justify-center gap-[6px] rounded-[10px] py-[11px] text-[13px] font-[600] text-white disabled:opacity-50"
            style={{ background: !missingRequired && agreedToTerms ? "#6BBF3E" : "#bbb" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {submitting === "publish" ? "公開中…" : "公開する"}
          </button>
        </div>
      )}

      {/* ── Publish confirm modal ── */}
      {showPublishConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowPublishConfirm(false)} aria-hidden />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-[#e8e6e0] bg-white p-6 shadow-xl">
            <p className="font-[600] text-[#1a1a1a]">この内容で公開しますか？</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#888]">公開後も編集できます。</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShowPublishConfirm(false)} className="rounded-[10px] border border-[#e8e6e0] px-4 py-2 text-[13px] text-[#555]">戻る</button>
              <button
                type="button"
                onClick={() => { setShowPublishConfirm(false); publishEvent(); }}
                disabled={submitting !== null}
                className="flex-1 rounded-[10px] py-2 text-[13px] font-[600] text-white transition disabled:opacity-50"
                style={{ background: "#6BBF3E" }}
              >
                {submitting === "publish" ? "公開中..." : "公開する"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function NewEventPage() {
  return (
    <OrganizerRegistrationGate>
      <Suspense fallback={<NewEventPageSkeleton />}>
        <NewEventPageContent />
      </Suspense>
    </OrganizerRegistrationGate>
  );
}
