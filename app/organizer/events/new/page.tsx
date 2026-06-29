"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { RecurrenceSelector } from "@/components/organizer/events/RecurrenceSelector";
import { formatEventScheduleLabel, type EventRecurrence } from "@/lib/event-recurrence";
import { buildPlanSummary, type PlanSummary } from "@/lib/organizer-plan-summary";
import { getJstNowHm, getJstTodayYmd, toJstTimestamp } from "@/lib/jst-date";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type Step = 1 | 2 | 3 | 4;
type FormErrors = Partial<Record<keyof EventFormData, string>>;

const PREFECTURES = ["東京都","大阪府","北海道","福岡県","愛知県","神奈川県","埼玉県","千葉県","京都府"];
const CITIES_BY_PREF: Record<string, string[]> = {
  東京都: ["渋谷区","新宿区","港区","中央区","その他"],
  大阪府: ["大阪市","その他"],
};

const initialForm: EventFormData = {
  title:"",imageUrl:"",description:"",date:"",startTime:"",endTime:"",
  location:"",address:"",price:0,priceNote:"",organizerName:"",organizerContact:"",
  rainPolicy:"",itemsToBring:[],access:"",childFriendly:false,prefecture:"",city:"",
  area:"",tags:[],sponsorTicketPrices:[],sponsorPerks:{},prioritySlots:0,
  englishGuideAvailable:false,capacity:undefined,requiresRegistration:false,
  participationMode:"none",registrationDeadline:undefined,registrationNote:undefined,
  recurrence:"none",recurrenceCount:null,
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
  if (!data.location.trim()) errors.location = "開催場所を入力してください";
  if (!data.address.trim()) errors.address = "住所を入力してください";
  if (data.price < 0) errors.price = "料金は0以上で入力してください";
  if (!data.organizerName?.trim()) errors.organizerName = "主催者名を入力してください";
  if (data.recurrence && data.recurrence !== "none" && (!data.recurrenceCount || data.recurrenceCount < 2)) {
    errors.recurrenceCount = "繰り返し回数を選択してください";
  }
  return errors;
}

// ── shared input style ──
const inp = "w-full min-w-0 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[14px] py-[10px] min-[900px]:py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
const inpErr = "!border-[#E8708A]";
const inpSm = "w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
const fieldSubLbl = "mb-1.5 text-[11px] text-[#888]";
const dateTimeStack = "space-y-3";
const dateTimeRow = "grid grid-cols-2 gap-3";
const stackedFields = "space-y-3.5";

function Fl({ label, required, opt }: { label: string; required?: boolean; opt?: string }) {
  return (
    <div className="mb-[5px] flex items-center gap-[5px] text-[13px] font-[500]">
      {label}
      {required && <span className="text-[10px] font-[600] text-[#c8a84b]">必須</span>}
      {opt && <span className="text-[10px] text-[#888]">{opt}</span>}
    </div>
  );
}
function Fh({ text }: { text: string }) {
  return <p className="mt-[4px] text-[11px] leading-[1.5] text-[#888]">{text}</p>;
}
function Fe({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-[4px] text-[11px] text-[#E8708A]">{msg}</p>;
}

// ── Step indicator ──
function StepIndicator({ current, onGo }: { current: Step; onGo: (s: Step) => void }) {
  const steps: Array<{ n: Step; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "開催情報" },
    { n: 3, label: "詳細情報" },
    { n: 4, label: "確認・公開", isCheck: true },
  ];

  return (
    <div className="flex min-w-0 flex-1 items-center gap-0">
      {steps.map(({ n, label, isCheck }, i) => {
        const isDone = current > n;
        const isActive = current === n;
        const isUpcoming = !isDone && !isActive;

        const circleClass = isDone
          ? "border-transparent bg-[#6BBF3E] text-white"
          : isActive
            ? "border-transparent bg-[#2B3A6B] text-white shadow-[0_0_0_3px_rgba(43,58,107,0.14)]"
            : "border-[#c8c4bc] bg-white text-[#5c5a54]";

        const labelClass = isDone
          ? "font-semibold text-[#3d8a24]"
          : isActive
            ? "font-semibold text-[#2B3A6B]"
            : "font-medium text-[#5c5a54]";

        return (
          <div key={n} className="flex min-w-0 flex-1 items-center">
            <button
              type="button"
              onClick={() => onGo(n as Step)}
              className={[
                "flex shrink-0 cursor-pointer items-center gap-[3px] rounded-full transition-colors min-[900px]:gap-2 min-[900px]:px-2 min-[900px]:py-1",
                isActive ? "min-[900px]:bg-[#EEF2FF]" : "hover:bg-[#f5f4f0]",
                "flex-col min-[900px]:flex-row",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                  "min-[900px]:h-[28px] min-[900px]:w-[28px] min-[900px]:text-[12px]",
                  circleClass,
                ].join(" ")}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : isCheck && isUpcoming ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/></svg>
                ) : (
                  n
                )}
              </div>
              <span className={`hidden whitespace-nowrap text-[12px] min-[900px]:inline ${labelClass}`}>
                {label}
              </span>
              <span className={`max-w-[3.25rem] truncate whitespace-nowrap text-[8px] leading-tight min-[900px]:hidden ${labelClass}`}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={[
                  "mx-1 h-[2px] flex-1 min-[900px]:mx-3 min-[900px]:h-[2px]",
                  current > n ? "bg-[#6BBF3E]" : "bg-[#d8d4cc]",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** PC用：固定幅コネクタで横に潰れないステッパー */
function PcStepIndicator({ current, onGo }: { current: Step; onGo: (s: Step) => void }) {
  const steps: Array<{ n: Step; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "開催情報" },
    { n: 3, label: "詳細情報" },
    { n: 4, label: "確認・公開", isCheck: true },
  ];

  return (
    <nav aria-label="作成ステップ" className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-1">
      {steps.map(({ n, label, isCheck }, i) => {
        const isDone = current > n;
        const isActive = current === n;
        const isUpcoming = !isDone && !isActive;

        const circleClass = isDone
          ? "border-transparent bg-[#6BBF3E] text-white"
          : isActive
            ? "border-transparent bg-[#2B3A6B] text-white shadow-[0_0_0_3px_rgba(43,58,107,0.14)]"
            : "border-[#c8c4bc] bg-white text-[#5c5a54]";

        const labelClass = isDone
          ? "font-semibold text-[#3d8a24]"
          : isActive
            ? "font-semibold text-[#2B3A6B]"
            : "font-medium text-[#5c5a54]";

        return (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && (
              <div
                aria-hidden
                className={["h-0.5 w-6 shrink-0 rounded-full sm:w-8", current > n - 1 ? "bg-[#6BBF3E]" : "bg-[#d8d4cc]"].join(" ")}
              />
            )}
            <button
              type="button"
              onClick={() => onGo(n)}
              className={[
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-2 py-0.5 transition-colors",
                isActive ? "bg-[#EEF2FF]" : "hover:bg-[#f5f4f0]",
              ].join(" ")}
            >
              <div className={["flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold", circleClass].join(" ")}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : isCheck && isUpcoming ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/></svg>
                ) : (
                  n
                )}
              </div>
              <span className={`whitespace-nowrap text-[12px] ${labelClass}`}>{label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

// ── PC step bar ──
function PcStepBar({
  current, onGo, onBack, onDraft, onPublish, submitting, planSummary, publishDisabledReason,
}: {
  current: Step; onGo: (s: Step) => void; onBack: () => void;
  onDraft: () => void; onPublish: () => void;
  submitting: null | "draft" | "publish";
  planSummary: PlanSummary | null;
  publishDisabledReason: null | "required_missing" | "no_slots";
}) {
  const backLabel = current === 1 ? "イベント一覧へ" : ["","基本情報に戻る","開催情報に戻る","詳細情報に戻る",""][current];
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
        <PcStepIndicator current={current} onGo={onGo} />
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

// ── Progress side panel ──
function SidePanel({
  form,
  agreedToTerms,
  setAgreedToTerms,
  currentStep,
  onNext,
  onPrev,
  nextLabel,
}: {
  form: EventFormData;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  currentStep: Step;
  onNext: () => void;
  onPrev: () => void;
  nextLabel: string;
}) {
  const prog = [
    { key: "イベント名", done: !!form.title.trim() },
    { key: "概要", done: !!form.description.trim() },
    { key: "主催者名", done: !!form.organizerName?.trim() },
    { key: "開催日時", done: !!form.date && !!form.startTime },
    { key: "開催場所", done: !!form.location.trim() },
    { key: "参加費", done: true },
  ];
  const filled = prog.filter(p => p.done).length;
  const pct = Math.round((filled / prog.length) * 100);

  return (
    <aside className="hidden min-[900px]:flex w-[272px] shrink-0 flex-col gap-2.5 border-l border-[#e8e6e0] bg-[#fafaf8] p-3.5 min-[900px]:min-h-0 min-[900px]:overflow-y-auto">
      <div className="rounded-[10px] border border-[#e8e6e0] bg-white p-3 shadow-sm">
        <div className="mb-2.5 flex items-center text-[12px] font-semibold text-[#1a1a1a]">
          入力の進捗
          <span className="ml-auto tabular-nums text-[#2B3A6B]">{filled}/{prog.length}</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#f0eeea]">
          <div className="h-full rounded-full bg-[#6BBF3E] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ul className="space-y-1">
          {prog.map(({ key, done }) => (
            <li key={key} className="flex items-center gap-2 rounded-[6px] px-1 py-1">
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: done ? "#6BBF3E" : "#E8708A" }}
                aria-hidden
              >
                {done ? "✓" : "!"}
              </div>
              <span className="flex-1 text-[12px] text-[#1a1a1a]">{key}</span>
              <span className="text-[11px] font-medium" style={{ color: done ? "#3a7a10" : "#c45a6a" }}>
                {done ? "完了" : "未入力"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-[10px] border border-[#e8e6e0] bg-white p-3 shadow-sm">
        <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5 shrink-0" style={{ accentColor: "#2B3A6B" }} />
        <span className="text-[12px] leading-[1.5] text-[#4a4844]">
          <Link href="/terms" target="_blank" className="text-[#c8a84b] hover:underline">利用規約</Link>
          に同意する
        </span>
      </label>

      <div className="flex flex-col gap-2">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="flex w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#e8e6e0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="15 18 9 12 15 6"/></svg>
            戻る
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-[#2B3A6B] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#243159]"
        >
          {nextLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <p className="text-center text-[11px] text-[#888]">STEP {currentStep} / 4</p>
      </div>

      <p className="text-[11px] leading-[1.5] text-[#2A5A74]">
        参加費ありの場合は
        <Link href="/organizer/settings/payout" className="font-medium hover:underline">売上受取設定</Link>
        をご確認ください。
      </p>
    </aside>
  );
}

// ── Tag selector (inline, used in both mobile and PC) ──
function TagSelector({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-[6px] min-[900px]:gap-1.5">
      {EVENT_TAGS.map(tag => {
        const on = selected.includes(tag.id);
        return (
          <button
            key={tag.id} type="button"
            onClick={() => onChange(on ? selected.filter(t => t !== tag.id) : [...selected, tag.id])}
            className="flex items-center gap-[5px] rounded-full border px-[12px] py-[6px] min-[900px]:px-3 min-[900px]:py-1.5 min-[900px]:text-[12px] text-[12px] transition"
            style={{
              background: on ? "#EEF2FF" : "#fff",
              borderColor: on ? "#2B3A6B" : "#e8e6e0",
              color: on ? "#2B3A6B" : "#1a1a1a",
            }}
          >
            <div
              className="flex h-[12px] w-[12px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px]"
              style={{ borderColor: on ? "#2B3A6B" : "#888", background: on ? "#2B3A6B" : "transparent", opacity: on ? 1 : 0.5 }}
            >
              {on && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Card wrapper (mobile) ──
function Card({ title, icon, sub, children }: { title: string; icon?: React.ReactNode; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 rounded-[10px] border border-[#e8e6e0] bg-white p-3 min-[900px]:mb-[10px] min-[900px]:rounded-[12px] min-[900px]:p-[14px]">
      <div className="mb-1 flex items-center gap-1.5 text-[13px] font-[600]">
        {icon}{title}
      </div>
      {sub && <p className="mb-2 text-[11px] text-[#888] min-[900px]:mb-[12px]">{sub}</p>}
      {children}
    </div>
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
      showToast("success", "下書きを保存しました");
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

  const goToStep = (s: Step) => setCurrentStep(s);
  const goNext = () => { if (currentStep < 4) setCurrentStep(s => (s + 1) as Step); };
  const goPrev = () => {
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
  const missingRequired = !form.location.trim() || !form.address.trim() || !form.date || !form.startTime || !form.title.trim() || !form.description.trim();

  const fieldM = "mb-2 min-[900px]:mb-2.5";
  const pcSectionHead = "hidden min-[900px]:block mb-4 pb-3 border-b border-[#e8e6e0]";
  const pcSectionTitle = "text-[15px] font-semibold text-[#2B3A6B] mb-0.5";
  const pcSectionSub = "text-[12px] text-[#5c5a54]";
  const pcFieldStack = "hidden min-[900px]:block space-y-3.5";

  return (
    <div ref={formTopRef} className="relative z-[1] flex flex-col min-[900px]:-mx-8 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:bg-white">

      {/* ── PC step bar ── */}
      <PcStepBar
        current={currentStep} onGo={goToStep} onBack={goPrev}
        onDraft={saveDraft} onPublish={() => { if (!agreedToTerms) { showToast("error","利用規約への同意が必要です"); return; } setShowPublishConfirm(true); }}
        submitting={submitting} planSummary={planSummary} publishDisabledReason={publishDisabledReason}
      />

      {/* ── Mobile header ── */}
      <div className="min-[900px]:hidden sticky top-0 z-10 -mx-4 border-b border-[#e8e6e0] bg-white sm:-mx-6">
        <div className="flex items-center gap-2 px-3 py-2">
          <button type="button" onClick={goPrev} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EF]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div className="flex-1 truncate text-[13px] font-[600]">{currentStep === 1 ? "新しいイベントを作成" : stepLabels[currentStep] + "を入力"}</div>
          <button type="button" onClick={saveDraft} disabled={!!submitting} className="shrink-0 rounded-[8px] bg-[#F3F2EF] px-2.5 py-1 text-[11px] font-[500] disabled:opacity-50">
            {submitting === "draft" ? "保存中…" : "下書き保存"}
          </button>
        </div>
        <div className="flex items-center px-3 pb-2">
          <StepIndicator current={currentStep} onGo={goToStep} />
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

          {/* ══ STEP 1 ══ */}
          {currentStep === 1 && (
            <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
                {/* PC section header */}
                <div className={pcSectionHead}>
                  <h3 className={`${pcSectionTitle} flex items-center gap-2`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    基本情報
                  </h3>
                  <p className={pcSectionSub}>イベント名・概要・主催者情報を入力してください</p>
                </div>

                {/* Mobile: all basic fields in one card */}
                <div className="min-[900px]:hidden">
                  <Card title="基本情報"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}>
                    <div className={fieldM}>
                      <Fl label="イベント名" required />
                      <input name="title" value={form.title} onChange={handleChange} placeholder="例：春の地域マルシェ" className={`${inpSm} ${errors.title ? inpErr : ""}`} />
                      <Fe msg={errors.title} />
                    </div>
                    <div className={fieldM}>
                      <Fl label="イベント概要" required />
                      <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="イベントの内容や魅力を簡潔に紹介してください" className={`${inpSm} resize-y min-h-[4.5rem] max-h-28 ${errors.description ? inpErr : ""}`} />
                      <Fe msg={errors.description} />
                    </div>
                    <div className="grid grid-cols-2 gap-[9px] mb-[11px]">
                      <div>
                        <Fl label="主催者名" required />
                        <input name="organizerName" value={form.organizerName ?? ""} onChange={handleChange} placeholder="例：地域振興会" className={`${inpSm} ${errors.organizerName ? inpErr : ""}`} />
                        <Fe msg={errors.organizerName} />
                      </div>
                      <div>
                        <Fl label="連絡先" opt="任意" />
                        <input name="organizerContact" value={form.organizerContact ?? ""} onChange={handleChange} placeholder="メール・電話" className={inpSm} style={{ fontSize: 11 }} />
                      </div>
                    </div>
                    <div className={fieldM}>
                      <Fl label="アイキャッチ画像" opt="任意" />
                      <EventImageInput url={form.imageUrl ?? ""} onChangeUrl={url => setForm(prev => ({ ...prev, imageUrl: url }))} alt={form.title || "プレビュー"} />
                    </div>
                    <div>
                      <Fl label="カテゴリー・タグ" opt="任意" />
                      <TagSelector selected={form.tags ?? []} onChange={tags => setForm(prev => ({ ...prev, tags }))} />
                    </div>
                  </Card>
                </div>

                {/* PC: title / description / organizer */}
                <div className={pcFieldStack}>
                  <div>
                    <Fl label="イベント名" required />
                    <input name="title" value={form.title} onChange={handleChange} placeholder="例：春の地域マルシェ" className={`${inp} ${errors.title ? inpErr : ""}`} />
                    <Fe msg={errors.title} />
                  </div>
                  <div>
                    <Fl label="イベント概要" required />
                    <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="イベントの内容や魅力を紹介してください" className={`${inp} resize-none ${errors.description ? inpErr : ""}`} />
                    <Fe msg={errors.description} />
                  </div>
                  <div className="border-t border-[#e8e6e0] pt-4 space-y-3.5">
                    <div>
                      <Fl label="主催者名" required />
                      <input name="organizerName" value={form.organizerName ?? ""} onChange={handleChange} placeholder="例：地域振興会 / 〇〇実行委員会" className={`${inp} ${errors.organizerName ? inpErr : ""}`} />
                      <Fe msg={errors.organizerName} />
                    </div>
                    <div>
                      <Fl label="連絡先" opt="任意" />
                      <input name="organizerContact" value={form.organizerContact ?? ""} onChange={handleChange} placeholder="例：03-1234-5678 / mail@example.com" className={inp} />
                    </div>
                  </div>
                </div>
              </div>

              {/* PC Right: image / tags */}
              <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
                <div className={pcSectionHead}>
                  <h3 className={pcSectionTitle}>画像・タグ</h3>
                  <p className={pcSectionSub}>アイキャッチとカテゴリーを設定します</p>
                </div>
                <div className={pcFieldStack}>
                  <div>
                    <Fl label="アイキャッチ画像" opt="任意" />
                    <EventImageInput compact url={form.imageUrl ?? ""} onChangeUrl={url => setForm(prev => ({ ...prev, imageUrl: url }))} alt={form.title || "プレビュー"} />
                  </div>
                  <div>
                    <Fl label="カテゴリー・特徴タグ" opt="複数選択可" />
                    <TagSelector selected={form.tags ?? []} onChange={tags => setForm(prev => ({ ...prev, tags }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {currentStep === 2 && (
            <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
              {/* PC Left: date / location */}
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
                <div className={pcSectionHead}>
                  <div className="flex items-center gap-2 text-[15px] font-[600] mb-0.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    開催日時・場所
                  </div>
                  <p className="text-[12px] text-[#888]">開催日時と会場名を入力してください</p>
                </div>

                {/* Mobile card */}
                <div className="min-[900px]:hidden">
                  <Card title="開催情報"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
                    <div className={fieldM}>
                      <Fl label="開催日時" required />
                      <div className={dateTimeStack}>
                        <div>
                          <div className={fieldSubLbl}>開催日</div>
                          <input name="date" type="date" value={form.date} onChange={handleChange} min={todayJst} className={`${inpSm} ${errors.date ? inpErr : ""}`} />
                        </div>
                        <div className={dateTimeRow}>
                          <div>
                            <div className={fieldSubLbl}>開始時刻</div>
                            <input name="startTime" type="time" value={form.startTime} onChange={handleChange} min={startTimeMin} className={`${inpSm} ${errors.startTime ? inpErr : ""}`} />
                          </div>
                          <div>
                            <div className={fieldSubLbl}>終了（任意）</div>
                            <input name="endTime" type="time" value={form.endTime || ""} onChange={handleChange} className={`${inpSm} ${errors.endTime ? inpErr : ""}`} />
                          </div>
                        </div>
                      </div>
                      <Fe msg={errors.date || errors.startTime || errors.endTime} />
                    </div>
                    <div className={fieldM}>
                      <Fl label="開催パターン" />
                      <RecurrenceSelector
                        value={form.recurrence ?? "none"}
                        count={form.recurrenceCount}
                        onChange={(recurrence) =>
                          setForm((prev) => ({
                            ...prev,
                            recurrence,
                            recurrenceCount: recurrence === "none" ? null : prev.recurrenceCount,
                          }))
                        }
                        onCountChange={(recurrenceCount) =>
                          setForm((prev) => ({ ...prev, recurrenceCount }))
                        }
                      />
                      <Fe msg={errors.recurrenceCount} />
                    </div>
                    <div className={fieldM}>
                      <Fl label="開催場所" required />
                      <input name="location" value={form.location} onChange={handleChange} placeholder="例：市民ホール / オンライン開催" className={`${inpSm} ${errors.location ? inpErr : ""}`} />
                      <Fh text="会場名や施設名を入力" />
                      <Fe msg={errors.location} />
                    </div>
                    <div className={`${stackedFields} mb-[11px]`}>
                      <div>
                        <Fl label="都道府県" required />
                        <select name="prefecture" value={form.prefecture ?? ""} onChange={handleChange} className={inpSm}>
                          <option value="">選択してください</option>
                          {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <Fl label="住所" required />
                        <input name="address" value={form.address} onChange={handleChange} placeholder="例：渋谷区〇〇町1-2-3" className={`${inpSm} ${errors.address ? inpErr : ""}`} />
                        <Fe msg={errors.address} />
                      </div>
                      <div>
                        <Fl label="アクセス" opt="任意" />
                        <input name="access" value={form.access || ""} onChange={handleChange} placeholder="例：渋谷駅徒歩10分" className={inpSm} />
                      </div>
                      <div>
                        <Fl label="参加費（円）" />
                        <input name="price" type="number" min={0} value={form.price} onChange={handleChange} className={inpSm} />
                        <Fh text="0で無料イベント" />
                      </div>
                      <div>
                        <Fl label="雨天時対応" opt="任意" />
                        <input name="rainPolicy" value={form.rainPolicy || ""} onChange={handleChange} placeholder="例：雨天決行" className={inpSm} />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* PC: date / location */}
                <div className={pcFieldStack}>
                  <div>
                    <Fl label="開催日時" required />
                    <div className={dateTimeStack}>
                      <div>
                        <div className={fieldSubLbl}>開催日</div>
                        <input name="date" type="date" value={form.date} onChange={handleChange} min={todayJst} className={`${inp} ${errors.date ? inpErr : ""}`} />
                      </div>
                      <div className={dateTimeRow}>
                        <div>
                          <div className={fieldSubLbl}>開始時刻</div>
                          <input name="startTime" type="time" value={form.startTime} onChange={handleChange} min={startTimeMin} className={`${inp} ${errors.startTime ? inpErr : ""}`} />
                        </div>
                        <div>
                          <div className={fieldSubLbl}>終了（任意）</div>
                          <input name="endTime" type="time" value={form.endTime || ""} onChange={handleChange} className={`${inp} ${errors.endTime ? inpErr : ""}`} />
                        </div>
                      </div>
                    </div>
                    <Fh text="終了時刻は未入力でも保存できます" />
                    <Fe msg={errors.date || errors.startTime || errors.endTime} />
                  </div>
                  <div>
                    <Fl label="開催パターン" />
                    <RecurrenceSelector
                      compact
                      value={form.recurrence ?? "none"}
                      count={form.recurrenceCount}
                      onChange={(recurrence: EventRecurrence) =>
                        setForm((prev) => ({
                          ...prev,
                          recurrence,
                          recurrenceCount: recurrence === "none" ? null : prev.recurrenceCount,
                        }))
                      }
                      onCountChange={(recurrenceCount) =>
                        setForm((prev) => ({ ...prev, recurrenceCount }))
                      }
                    />
                    <Fe msg={errors.recurrenceCount} />
                  </div>
                  <div>
                    <Fl label="開催場所" required />
                    <input name="location" value={form.location} onChange={handleChange} placeholder="例：市民ホール / オンライン開催" className={`${inp} ${errors.location ? inpErr : ""}`} />
                    <Fh text="会場名や施設名を入力してください" />
                    <Fe msg={errors.location} />
                  </div>
                </div>
              </div>

              {/* PC Right: address / fee */}
              <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
                <div className={pcSectionHead}>
                  <h3 className={pcSectionTitle}>住所・参加費</h3>
                  <p className={pcSectionSub}>住所・アクセスと参加費を設定します</p>
                </div>
                <div className={pcFieldStack}>
                  <div>
                    <Fl label="都道府県" required />
                    <select name="prefecture" value={form.prefecture ?? ""} onChange={handleChange} className={inp}>
                      <option value="">選択してください</option>
                      {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <Fl label="住所" required />
                    <input name="address" value={form.address} onChange={handleChange} placeholder="例：渋谷区〇〇町1-2-3" className={`${inp} ${errors.address ? inpErr : ""}`} />
                    <Fe msg={errors.address} />
                  </div>
                  {form.prefecture && (CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
                    <div>
                      <Fl label="市区町村" opt="任意" />
                      <select name="city" value={form.city ?? ""} onChange={handleChange} className={inp}>
                        <option value="">選択してください</option>
                        {CITIES_BY_PREF[form.prefecture]?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <Fl label="アクセス" opt="任意" />
                    <input name="access" value={form.access || ""} onChange={handleChange} placeholder="例：渋谷駅徒歩10分" className={inp} />
                    <Fh text="目印や最寄り駅・バス停など" />
                  </div>
                  <div className="border-t border-[#e8e6e0] pt-4 space-y-3.5">
                    <div>
                      <Fl label="参加費（円）" />
                      <input name="price" type="number" min={0} value={form.price} onChange={handleChange} className={`${inp} ${errors.price ? inpErr : ""}`} />
                      <Fh text="0で無料。有料の場合はStripe設定が必要です" />
                      <Fe msg={errors.price} />
                    </div>
                    <div>
                      <Fl label="雨天時対応" opt="任意" />
                      <input name="rainPolicy" value={form.rainPolicy || ""} onChange={handleChange} placeholder="例：雨天決行 / 小雨決行・荒天中止" className={inp} />
                      <Fh text="開催方針を短く記載してください" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3 ══ */}
          {currentStep === 3 && (
            <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
              <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
                <div className={pcSectionHead}>
                  <div className="flex items-center gap-2 text-[15px] font-[600] mb-0.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    詳細情報（任意）
                  </div>
                  <p className="text-[12px] text-[#888]">必要なときだけ入力してください。あとから編集できます</p>
                </div>

                {/* Mobile */}
                <div className="min-[900px]:hidden">
                  <Card title="詳細情報（任意）"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}>
                    <div className="grid grid-cols-2 gap-[9px] mb-[11px]">
                      <div>
                        <Fl label="定員" opt="任意" />
                        <input name="capacity" type="number" min={0} value={form.capacity ?? ""} onChange={e => setForm(prev => ({ ...prev, capacity: e.target.value ? Number(e.target.value) : undefined }))} placeholder="未入力で無制限" className={inpSm} />
                        <Fh text="未入力で無制限" />
                      </div>
                      <div>
                        <Fl label="申込締め切り" opt="任意" />
                        <input name="registrationDeadline" type="date" value={form.registrationDeadline ? new Date(form.registrationDeadline).toISOString().slice(0,10) : ""} onChange={e => setForm(prev => ({ ...prev, registrationDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inpSm} style={{ fontSize:11 }} />
                      </div>
                    </div>
                    <div className={fieldM}>
                      <Fl label="アクセス" opt="任意" />
                      <input name="access" value={form.access || ""} onChange={handleChange} placeholder="例：最寄り駅から徒歩10分" className={inpSm} />
                    </div>
                    <div className={fieldM}>
                      <Fl label="持ち物・服装" opt="任意" />
                      <input value={itemsInput} onChange={e => setItemsInput(e.target.value)} onBlur={handleItemsBlur} placeholder="例：動きやすい服装、飲み物" className={inpSm} />
                    </div>
                    <div>
                      <Fl label="備考・注意事項" opt="任意" />
                      <textarea name="registrationNote" value={form.registrationNote ?? ""} onChange={e => setForm(prev => ({ ...prev, registrationNote: e.target.value || undefined }))} rows={2} placeholder="参加者への特記事項があれば入力してください" className={`${inpSm} resize-y min-h-[4rem] max-h-24`} />
                    </div>
                  </Card>
                </div>

                {/* PC */}
                <div className={pcFieldStack}>
                  <div>
                    <Fl label="定員" opt="任意" />
                    <input name="capacity" type="number" min={0} value={form.capacity ?? ""} onChange={e => setForm(prev => ({ ...prev, capacity: e.target.value ? Number(e.target.value) : undefined }))} placeholder="例：30" className={inp} />
                    <Fh text="未入力で無制限。設定すると定員に達した時点で申し込みが締め切られます" />
                  </div>
                  <div>
                    <Fl label="申し込み締め切り" opt="任意" />
                    <input type="date" value={form.registrationDeadline ? new Date(form.registrationDeadline).toISOString().slice(0,10) : ""} onChange={e => setForm(prev => ({ ...prev, registrationDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inp} />
                    <Fh text="未入力の場合は開催日まで受け付けます" />
                  </div>
                  <div>
                    <Fl label="持ち物・服装" opt="任意" />
                    <input value={itemsInput} onChange={e => setItemsInput(e.target.value)} onBlur={handleItemsBlur} placeholder="例：動きやすい服装、飲み物、筆記用具" className={inp} />
                    <Fh text="カンマまたは改行で区切って入力" />
                  </div>
                  <div>
                    <Fl label="備考・注意事項" opt="任意" />
                    <textarea name="registrationNote" value={form.registrationNote ?? ""} onChange={e => setForm(prev => ({ ...prev, registrationNote: e.target.value || undefined }))} rows={4} placeholder="参加者への特記事項があれば入力してください。キャンセルポリシーや注意事項など。" className={`${inp} resize-none`} />
                  </div>
                </div>
              </div>

              {/* PC Right: post-publish features */}
              <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
                <div className="mb-3 pb-2 border-b border-[#e8e6e0]">
                  <div className="text-[15px] font-[600] text-[#888] mb-0.5">公開後に設定できること</div>
                  <p className="text-[11px] text-[#888]">イベント公開後にこれらの機能を追加できます</p>
                </div>
                <div className="flex flex-col gap-[12px]">
                  {[
                    { bg:"#EEF4FB", stroke:"#2B3A6B", icon:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>, title:"スタッフを募集する", desc:"受付・誘導・設営など役割ごとに募集できます。公開後にスタッフ募集ページから設定できます。", btn:"スタッフ募集ページへ →", href:"/organizer/events" },
                    { bg:"#FFF8EC", stroke:"#c8a84b", icon:<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>, title:"協賛を受け付ける", desc:"売上受取設定（Stripe）完了後に利用できます。協賛金の受け取りが可能になります。", btn:"公開後に設定できます", href:"#" },
                    { bg:"#EAF6DE", stroke:"#3a7a10", icon:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, title:"参加者へのメッセージ", desc:"公開後、参加申込者と受信箱でメッセージのやりとりができます。", btn:null, href:null },
                  ].map(({ bg, stroke, icon, title, desc, btn, href }) => (
                    <div key={title} className="flex gap-[12px] items-flex-start rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]">
                      <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px]" style={{ background: bg }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                      </div>
                      <div>
                        <div className="mb-1 text-[13px] font-[500]">{title}</div>
                        <p className="mb-2 text-[12px] leading-[1.6] text-[#888]">{desc}</p>
                        {btn && href && (
                          <Link href={href} className="rounded-[8px] border border-[#e8e6e0] bg-white px-[14px] py-[6px] text-[12px] text-[#2B3A6B] hover:bg-[#f5f4f0]">{btn}</Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                  <p className="mb-[8px] text-[13px] leading-[1.7] text-[#555]">保存は下書きとして行われます。あとで編集・公開できます。</p>
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
                <p className="mt-[10px] text-center text-[12px] text-[#888]">下書きとして保存され、あとで編集・公開できます</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel (PC, steps 1–3) ── */}
        {currentStep < 4 && (
          <SidePanel
            form={form}
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
            currentStep={currentStep}
            onNext={goNext}
            onPrev={goPrev}
            nextLabel={nextLabels[currentStep]}
          />
        )}
      </div>

      {/* ── Footer nav (mobile step 1–3) ── */}
      {currentStep < 4 && (
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
