"use client";

import { EVENT_TAGS } from "@/lib/db/types";
import { isOnlineCapableFormat, needsVenueFields, normalizeEventFormat } from "@/lib/event-online";

export type EventFormStep = 1 | 2 | 3 | 4;

export const EVENT_FORM_PREFECTURES = [
  "東京都",
  "大阪府",
  "北海道",
  "福岡県",
  "愛知県",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "京都府",
];

export const EVENT_FORM_CITIES_BY_PREF: Record<string, string[]> = {
  東京都: ["渋谷区", "新宿区", "港区", "中央区", "その他"],
  大阪府: ["大阪市", "その他"],
};

export const eventFormInp =
  "w-full max-w-full min-w-0 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[14px] py-[10px] min-[900px]:py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
export const eventFormInpErr = "!border-[#E8708A]";
export const eventFormInpSm =
  "w-full max-w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
export const eventFormFieldSubLbl = "mb-1.5 text-[11px] text-[#888]";
export const eventFormDateTimeStack = "min-w-0 space-y-3";
export const eventFormDateTimeRow = "grid min-w-0 grid-cols-2 gap-3 [&>*]:min-w-0";
export const eventFormStackedFields = "space-y-3.5";
export const eventFormFieldM = "mb-2 min-[900px]:mb-2.5";
export const eventFormPcSectionHead =
  "hidden min-[900px]:block mb-2.5 pb-2 border-b border-[#e8e6e0]";
export const eventFormPcSectionTitle = "text-[14px] font-semibold text-[#2B3A6B] mb-0.5";
export const eventFormPcSectionSub = "text-[11.5px] text-[#5c5a54]";
export const eventFormPcFieldStack = "hidden min-[900px]:block space-y-2";

export function EventFormLabel({
  label,
  required,
  opt,
}: {
  label: string;
  required?: boolean;
  opt?: string;
}) {
  return (
    <div className="mb-0.5 flex items-center gap-[5px] text-[12.5px] font-[500]">
      {label}
      {required && (
        <span className="text-[10px] font-[600] text-[#c8a84b]">必須</span>
      )}
      {opt && <span className="text-[10px] text-[#888]">{opt}</span>}
    </div>
  );
}

export function EventFormHint({ text }: { text: string }) {
  return <p className="mt-[4px] text-[11px] leading-[1.5] text-[#888]">{text}</p>;
}

export function EventFormError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-[4px] text-[11px] text-[#E8708A]">{msg}</p>;
}

export function EventFormCard({
  title,
  icon,
  sub,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 min-w-0 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white p-2.5 min-[900px]:mb-2 min-[900px]:rounded-[10px] min-[900px]:p-3">
      <div className="mb-0.5 flex items-center gap-1.5 text-[13px] font-[600]">
        {icon}
        {title}
      </div>
      {sub && (
        <p className="mb-1.5 text-[11px] text-[#888]">{sub}</p>
      )}
      {children}
    </div>
  );
}

function EventFormTagPill({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-[5px] rounded-full border px-[12px] py-[6px] text-[12px] transition min-[900px]:px-2.5 min-[900px]:py-1 min-[900px]:text-[11.5px]"
      style={{
        background: on ? "#EEF2FF" : "#fff",
        borderColor: on ? "#2B3A6B" : "#e8e6e0",
        color: on ? "#2B3A6B" : "#1a1a1a",
      }}
    >
      <div
        className="flex h-[12px] w-[12px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px]"
        style={{
          borderColor: on ? "#2B3A6B" : "#888",
          background: on ? "#2B3A6B" : "transparent",
          opacity: on ? 1 : 0.5,
        }}
      >
        {on && (
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {label}
    </button>
  );
}

export function EventFormTagSelector({
  selected,
  onChange,
  childFriendly,
  onChildFriendlyChange,
  englishGuideAvailable,
  onEnglishGuideAvailableChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  childFriendly?: boolean;
  onChildFriendlyChange?: (value: boolean) => void;
  englishGuideAvailable?: boolean;
  onEnglishGuideAvailableChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[6px] min-[900px]:gap-1.5">
      {EVENT_TAGS.map((tag) => {
        const on = selected.includes(tag.id);
        return (
          <EventFormTagPill
            key={tag.id}
            label={tag.label}
            on={on}
            onToggle={() =>
              onChange(
                on ? selected.filter((t) => t !== tag.id) : [...selected, tag.id]
              )
            }
          />
        );
      })}
      {onChildFriendlyChange != null && (
        <EventFormTagPill
          label="子連れOK"
          on={Boolean(childFriendly)}
          onToggle={() => onChildFriendlyChange(!childFriendly)}
        />
      )}
      {onEnglishGuideAvailableChange != null && (
        <EventFormTagPill
          label="英語対応あり"
          on={Boolean(englishGuideAvailable)}
          onToggle={() => onEnglishGuideAvailableChange(!englishGuideAvailable)}
        />
      )}
    </div>
  );
}

export function EventFormStepIndicator({
  current,
  onGo,
}: {
  current: EventFormStep;
  onGo: (s: EventFormStep) => void;
}) {
  const steps: Array<{ n: EventFormStep; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "開催情報" },
    { n: 3, label: "詳細情報" },
    { n: 4, label: "確認", isCheck: true },
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
              onClick={() => onGo(n)}
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
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCheck && isUpcoming ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="9 11 12 14 22 4" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span
                className={`hidden whitespace-nowrap text-[12px] min-[900px]:inline ${labelClass}`}
              >
                {label}
              </span>
              <span
                className={`max-w-[3.25rem] truncate whitespace-nowrap text-[8px] leading-tight min-[900px]:hidden ${labelClass}`}
              >
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

export function EventFormPcStepIndicator({
  current,
  onGo,
  finalLabel = "確認・公開",
}: {
  current: EventFormStep;
  onGo: (s: EventFormStep) => void;
  finalLabel?: string;
}) {
  const steps: Array<{ n: EventFormStep; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "開催情報" },
    { n: 3, label: "詳細情報" },
    { n: 4, label: finalLabel, isCheck: true },
  ];

  return (
    <nav
      aria-label="フォームステップ"
      className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-1"
    >
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
                className={[
                  "h-0.5 w-6 shrink-0 rounded-full sm:w-8",
                  current > n - 1 ? "bg-[#6BBF3E]" : "bg-[#d8d4cc]",
                ].join(" ")}
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
              <div
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  circleClass,
                ].join(" ")}
              >
                {isDone ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCheck && isUpcoming ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="9 11 12 14 22 4" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span className={`whitespace-nowrap text-[12px] ${labelClass}`}>
                {label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export function EventFormSidePanel({
  form,
  currentStep,
  onNext,
  onPrev,
  nextLabel,
  footerNote,
}: {
  form: {
    title: string;
    description: string;
    organizerName?: string;
    date: string;
    startTime: string;
    location: string;
    price: number;
    eventFormat?: "onsite" | "online" | "hybrid";
    onlineService?: string | null;
    onlineJoinUrl?: string | null;
    rainPolicy?: string;
  };
  currentStep: EventFormStep;
  onNext: () => void;
  onPrev: () => void;
  nextLabel: string;
  footerNote?: React.ReactNode;
}) {
  const format = normalizeEventFormat(form.eventFormat);
  const showVenue = needsVenueFields(format);
  const showOnline = isOnlineCapableFormat(format);

  const prog = [
    { key: "イベント名", done: !!form.title.trim() },
    { key: "概要", done: !!form.description.trim() },
    { key: "主催者名", done: !!form.organizerName?.trim() },
    { key: "開催日時", done: !!form.date && !!form.startTime },
    ...(showVenue ? [{ key: "開催場所", done: !!form.location.trim() }] : []),
    ...(showOnline
      ? [
          {
            key: "オンライン設定",
            done: !!form.onlineService && !!form.onlineJoinUrl?.trim(),
          },
        ]
      : []),
    { key: "参加費", done: true },
    ...(showVenue ? [{ key: "雨天時対応", done: true }] : []),
  ];
  const filled = prog.filter((p) => p.done).length;
  const pct = Math.round((filled / prog.length) * 100);

  return (
    <aside className="hidden min-[900px]:flex w-[240px] shrink-0 flex-col border-l border-[#e8e6e0] bg-[#fafaf8] min-[900px]:min-h-0">
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        <div className="rounded-[10px] border border-[#e8e6e0] bg-white p-2.5 shadow-sm">
          <div className="mb-2 flex items-center text-[12px] font-semibold text-[#1a1a1a]">
            入力の進捗
            <span className="ml-auto tabular-nums text-[#2B3A6B]">
              {filled}/{prog.length}
            </span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#f0eeea]">
            <div
              className="h-full rounded-full bg-[#6BBF3E] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-0.5">
            {prog.map(({ key, done }) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-[6px] px-1 py-0.5"
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: done ? "#6BBF3E" : "#E8708A" }}
                  aria-hidden
                >
                  {done ? "✓" : "!"}
                </div>
                <span className="flex-1 text-[12px] text-[#1a1a1a]">{key}</span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: done ? "#3a7a10" : "#c45a6a" }}
                >
                  {done ? "完了" : "未入力"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {footerNote !== undefined ? (
          <div className="mt-2">{footerNote}</div>
        ) : form.price > 0 ? (
          <p className="mt-2 text-[11px] leading-[1.55] text-[#2A5A74]">
            参加費ありのイベントは、クレジット決済・オンライン支払い設定をご確認ください。
          </p>
        ) : null}
      </div>

      <div className="shrink-0 space-y-1 border-t border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-2">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#e8e6e0] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0]"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            戻る
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#2B3A6B] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#243159]"
        >
          {nextLabel}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <p className="text-center text-[10.5px] text-[#888]">STEP {currentStep} / 4</p>
      </div>
    </aside>
  );
}
