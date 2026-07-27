"use client";

import Link from "next/link";
import {
  Calendar,
  Check,
  Clock,
  FileText,
  Lock,
  MapPin,
  Send,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { cn } from "@/lib/utils";
import {
  type ApplicationFormAnswers,
  type ApplicationFormConfig,
  type ApplicationFormFieldDef,
  type ApplicationFormFieldId,
  type CustomQuestion,
} from "@/lib/recruitment-application-form";

export type ApplicationFormRecruitmentSummary = {
  id: string;
  title: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  meeting_place?: string | null;
  roles: { name: string; count: number }[];
  provisions?: string | null;
  items_to_bring?: string | null;
  notes?: string | null;
  organizerName?: string | null;
  /** サマリー左のカバー画像（任意） */
  coverImageUrl?: string | null;
};

export type ApplicationFormProfile = {
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

type Props = {
  recruitmentId: string;
  recruitment: ApplicationFormRecruitmentSummary;
  config: ApplicationFormConfig;
  answers: ApplicationFormAnswers;
  profile: ApplicationFormProfile;
  email?: string | null;
  error?: string | null;
  submitting: boolean;
  savingDraft: boolean;
  draftSaved: boolean;
  /** プレビュー用：ブレークポイントに関係なくPCレイアウトを表示 */
  forceShow?: boolean;
  /** 選択不可の役割名（満員・別募集向けなど） */
  lockedRoleNames?: string[];
  onChange: (id: string, value: string | boolean) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

const AVAILABLE_TIME_OPTIONS = ["終日参加可", "午前のみ", "午後のみ"] as const;
const MESSAGE_MAX = 1000;

const TEXT_AREA_IDS = new Set<ApplicationFormFieldId>([
  "message",
  "experience",
  "self_intro",
]);

const inputClass =
  "w-full rounded-md border border-[#d8e0d4] bg-[#F7F9F6] px-2.5 py-1.5 text-[12px] text-[#1a2818] outline-none focus:border-[#6BBF3E] focus:bg-white";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  } catch {
    return "—";
  }
}

function formatTimeRange(startAt?: string | null, endAt?: string | null): string {
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      });
    } catch {
      return "";
    }
  };
  const start = startAt ? fmt(startAt) : "";
  const end = endAt ? fmt(endAt) : "";
  if (start && end) return `${start}〜${end}`;
  if (start) return start;
  return "—";
}

function buildTags(r: ApplicationFormRecruitmentSummary): string[] {
  const tags: string[] = [];
  const primaryRole = r.roles.find((x) => x.name.trim())?.name;
  if (primaryRole) tags.push(primaryRole);
  const prov = r.provisions?.trim() ?? "";
  if (/交通/.test(prov)) tags.push("交通費支給");
  if (/食|弁|昼食|軽食/.test(prov)) tags.push("食事あり");
  if (prov && tags.length < 3 && !tags.includes(prov)) {
    tags.push(prov.length > 10 ? `${prov.slice(0, 10)}…` : prov);
  }
  return tags.slice(0, 4);
}

function isAnswered(
  field: ApplicationFormFieldDef,
  answers: ApplicationFormAnswers,
  profile: ApplicationFormProfile
): boolean {
  if (field.autoFromProfile) {
    if (field.id === "name") return Boolean(profile.displayName?.trim());
    if (field.id === "phone") return Boolean(profile.phone?.trim() || answers.phone);
    return true;
  }
  if (field.id === "terms") {
    return answers.terms === true || answers.terms === "true";
  }
  if (field.id === "portrait") {
    return Boolean(profile.avatarUrl || answers.portrait);
  }
  const v = answers[field.id];
  return typeof v === "string" && v.trim().length > 0;
}

function isCustomAnswered(q: CustomQuestion, answers: ApplicationFormAnswers): boolean {
  const v = answers[q.id];
  return typeof v === "string" && v.trim().length > 0;
}

function FieldBadge({ required, auto }: { required?: boolean; auto?: boolean }) {
  if (auto) {
    return (
      <span className="rounded px-1 py-px text-[9px] font-semibold text-[#3a7a10] bg-[#eef3ea]">
        自動
      </span>
    );
  }
  if (required) {
    return (
      <span className="rounded px-1 py-px text-[9px] font-semibold text-[#E8708A] bg-[#FEF2F2]">
        必須
      </span>
    );
  }
  return (
    <span className="rounded px-1 py-px text-[9px] font-medium text-[#8a9e80] bg-[#f0eeea]">
      任意
    </span>
  );
}

function SectionCard({
  id,
  index,
  title,
  hint,
  children,
  className,
}: {
  id?: string;
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-2 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white",
        className
      )}
    >
      <div className="flex items-baseline gap-2 border-b border-[#f0f2ec] px-3 py-1.5">
        <span className="text-[11px] font-bold tabular-nums text-[#6BBF3E]">{index}</span>
        <h2 className="text-[13px] font-semibold text-[#1a2818]">{title}</h2>
        {hint ? <p className="ml-auto text-[10px] text-[#8a9e80]">{hint}</p> : null}
      </div>
      <div className="space-y-2 px-3 py-2.5">{children}</div>
    </section>
  );
}

function SegmentedOptions({
  options,
  value,
  onChange,
  lockedOptions,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  lockedOptions?: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const locked = lockedOptions?.has(opt);
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            disabled={locked}
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition-colors",
              locked && "cursor-not-allowed border-[#e8e6e0] bg-[#f5f4f0] text-[#a8b0a4]",
              !locked && selected && "border-[#6BBF3E] bg-[#6BBF3E] text-white",
              !locked &&
                !selected &&
                "border-[#d8e0d4] bg-white text-[#2d4a28] hover:border-[#6BBF3E]/60 hover:bg-[#f3faf0]"
            )}
          >
            {locked ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function ApplicationFormPcView({
  recruitmentId,
  recruitment,
  config,
  answers,
  profile,
  email,
  error,
  submitting,
  savingDraft,
  draftSaved,
  forceShow = false,
  lockedRoleNames = [],
  onChange,
  onBack,
  onSaveDraft,
  onSubmit,
}: Props) {
  const enabledFields = config.fields.filter((f) => f.enabled);
  const profileFields = enabledFields.filter((f) => f.section === "profile");
  const applicationFields = enabledFields.filter((f) => f.section === "application");
  const extraFields = enabledFields.filter((f) => f.section === "extra");
  const customQuestions = config.customQuestions.filter((q) => q.label.trim());
  const roleOptions = recruitment.roles.map((r) => r.name).filter(Boolean);
  const lockedRoles = new Set(lockedRoleNames);
  const tags = buildTags(recruitment);
  const primaryRole =
    (typeof answers.desired_role === "string" && answers.desired_role) ||
    roleOptions[0] ||
    "スタッフ";
  const initials = (profile.displayName?.trim() || "?").slice(0, 1);

  const progressItems: { key: string; done: boolean; focusId: string }[] = [];
  if (profileFields.length > 0) {
    progressItems.push({
      key: "基本プロフィール",
      done: profileFields.every((f) => !f.required || isAnswered(f, answers, profile)),
      focusId: "af-section-profile",
    });
  }
  if (applicationFields.length > 0) {
    const appRequired = applicationFields.filter((f) => f.required);
    progressItems.push({
      key: "今回の応募について",
      done: appRequired.every((f) => isAnswered(f, answers, profile)),
      focusId: "af-section-application",
    });
  }
  if (extraFields.length > 0 || customQuestions.length > 0) {
    const extraOk = extraFields
      .filter((f) => f.required)
      .every((f) => isAnswered(f, answers, profile));
    const customOk = customQuestions
      .filter((q) => q.required)
      .every((q) => isCustomAnswered(q, answers));
    progressItems.push({
      key: "追加確認",
      done: extraOk && customOk,
      focusId: "af-section-extra",
    });
  }
  if (progressItems.length === 0) {
    progressItems.push({ key: "入力項目", done: true, focusId: "af-section-profile" });
  }
  const filled = progressItems.filter((p) => p.done).length;
  const remaining = progressItems.length - filled;
  const nextIncomplete = progressItems.find((p) => !p.done);
  const messageValue = typeof answers.message === "string" ? answers.message : "";
  const messageIncomplete =
    applicationFields.some((f) => f.id === "message" && f.enabled && f.required) &&
    !messageValue.trim();

  const focusSection = (focusId: string) => {
    const el = document.getElementById(focusId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const focusable = el.querySelector<HTMLElement>(
      "textarea:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), button:not([disabled])"
    );
    focusable?.focus({ preventScroll: true });
  };

  const renderApplicationField = (field: ApplicationFormFieldDef) => {
    if (field.id === "desired_role") {
      return (
        <div key={field.id} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-[#1a2818]">{field.label}</label>
            <FieldBadge required={field.required} />
          </div>
          {roleOptions.length > 0 ? (
            <SegmentedOptions
              options={roleOptions}
              value={typeof answers.desired_role === "string" ? answers.desired_role : ""}
              onChange={(v) => onChange("desired_role", v)}
              lockedOptions={lockedRoles}
            />
          ) : (
            <input
              type="text"
              value={typeof answers.desired_role === "string" ? answers.desired_role : ""}
              onChange={(e) => onChange("desired_role", e.target.value)}
              placeholder="希望する役割"
              className={inputClass}
            />
          )}
        </div>
      );
    }

    if (field.id === "available_time") {
      const current =
        typeof answers.available_time === "string" ? answers.available_time : "";
      const note =
        typeof answers.available_time_note === "string"
          ? answers.available_time_note
          : "";
      return (
        <div key={field.id} className="space-y-1.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-medium text-[#1a2818]">{field.label}</label>
              <FieldBadge required={field.required} />
            </div>
            <SegmentedOptions
              options={[...AVAILABLE_TIME_OPTIONS]}
              value={current}
              onChange={(v) => onChange("available_time", v)}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-medium text-[#566358]" htmlFor="af-time-other">
                その他の希望時間
              </label>
              <FieldBadge />
            </div>
            <input
              id="af-time-other"
              type="text"
              value={note}
              onChange={(e) => onChange("available_time_note", e.target.value)}
              placeholder="例：10:00〜14:00"
              className={inputClass}
            />
          </div>
        </div>
      );
    }

    if (field.id === "experience") {
      return (
        <div key={field.id} className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-[#1a2818]" htmlFor="af-experience">
              {field.label}
            </label>
            <FieldBadge required={field.required} />
          </div>
          <input
            id="af-experience"
            type="text"
            value={typeof answers.experience === "string" ? answers.experience : ""}
            onChange={(e) => onChange("experience", e.target.value)}
            placeholder={field.placeholder || "関連する経験やスキルがあれば入力"}
            className={inputClass}
          />
        </div>
      );
    }

    if (field.id === "self_intro") {
      const introValue =
        typeof answers.self_intro === "string" ? answers.self_intro : "";
      return (
        <div key={field.id} className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-[#1a2818]" htmlFor="af-self-intro">
              {field.label}
            </label>
            <FieldBadge required={field.required} />
          </div>
          <textarea
            id="af-self-intro"
            value={introValue}
            onChange={(e) => onChange("self_intro", e.target.value)}
            placeholder={
              field.placeholder || "簡単な自己紹介や、ボランティアへの想いがあれば入力してください"
            }
            rows={3}
            className={cn(inputClass, "resize-none leading-relaxed")}
          />
        </div>
      );
    }

    if (field.id === "message") {
      return (
        <div key={field.id} className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-medium text-[#1a2818]" htmlFor="af-message">
              {field.label}
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums text-[#8a9e80]">
                {messageValue.length}/{MESSAGE_MAX}
              </span>
              <FieldBadge required={field.required} />
            </div>
          </div>
          <textarea
            id="af-message"
            value={messageValue}
            onChange={(e) => onChange("message", e.target.value.slice(0, MESSAGE_MAX))}
            placeholder={
              field.placeholder ||
              "志望動機や自己紹介があれば入力してください"
            }
            rows={3}
            className={cn(
              inputClass,
              "resize-none leading-relaxed",
              messageIncomplete && "border-[#6BBF3E] bg-white ring-1 ring-[#6BBF3E]/25"
            )}
          />
          {messageIncomplete ? (
            <p className="text-[10px] text-[#566358]">まだ入力されていません（必須）</p>
          ) : null}
        </div>
      );
    }

    const isArea = TEXT_AREA_IDS.has(field.id);
    const fieldValue =
      typeof answers[field.id] === "string" ? (answers[field.id] as string) : "";

    return (
      <div key={field.id} className="space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-medium text-[#1a2818]" htmlFor={`af-${field.id}`}>
            {field.label}
          </label>
          <FieldBadge required={field.required} />
        </div>
        {isArea ? (
          <textarea
            id={`af-${field.id}`}
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            className={cn(inputClass, "resize-none")}
          />
        ) : (
          <input
            id={`af-${field.id}`}
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        )}
      </div>
    );
  };

  let sectionIndex = 0;
  const nextIndex = () => {
    sectionIndex += 1;
    return String(sectionIndex).padStart(2, "0");
  };

  const profileSectionIndex = profileFields.length > 0 ? nextIndex() : null;
  const applicationSectionIndex = applicationFields.length > 0 ? nextIndex() : null;
  const extraSectionIndex =
    extraFields.length > 0 || customQuestions.length > 0 ? nextIndex() : null;

  const phoneEnabled = profileFields.some((f) => f.id === "phone");
  const phoneValue =
    typeof answers.phone === "string" ? answers.phone : profile.phone || "";

  return (
    <div
      className={cn(
        "flex-col overflow-hidden bg-[#f3f4f1]",
        forceShow
          ? "flex h-full min-h-0"
          : "hidden h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:flex"
      )}
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto flex h-full w-full max-w-[1280px] flex-col px-4 pb-0 pt-2"
      >
        <div className="mb-2 flex shrink-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <Breadcrumb
              className="mb-1 text-[11px]"
              items={[
                { label: "トップ", href: "/" },
                { label: "ボランティア募集", href: "/volunteer" },
                { label: primaryRole, href: `/recruitments/${recruitmentId}` },
                { label: "応募" },
              ]}
            />
            <h1 className="text-[18px] font-semibold tracking-tight text-[#1a2818]">
              スタッフ応募フォーム
            </h1>
            <p className="mt-0.5 text-[11px] text-[#566358]">
              必要事項を入力して応募してください。入力内容は主催者に共有されます。
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mb-0.5 shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#566358] hover:bg-white"
          >
            戻る
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-0.5">
            <div className="space-y-2 pb-3">
            {/* 横型サマリー */}
            <div className="flex h-[76px] shrink-0 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white">
              <div className="relative h-full w-[100px] shrink-0 bg-gradient-to-br from-[#3a633d] via-[#4a7c2e] to-[#6BBF3E] sm:w-[112px]">
                {recruitment.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={recruitment.coverImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-[13px] font-semibold text-[#1a2818]">{primaryRole}</p>
                  <p className="truncate text-[11px] text-[#566358]">{recruitment.title}</p>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#d8ecd0] bg-[#f3faf0] px-1.5 py-px text-[9px] font-medium text-[#3a633d]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#566358]">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#8a9e80]" aria-hidden />
                    {formatDate(recruitment.start_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#8a9e80]" aria-hidden />
                    {formatTimeRange(recruitment.start_at, recruitment.end_at)}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-[#8a9e80]" aria-hidden />
                    <span className="truncate">{recruitment.meeting_place || "場所未設定"}</span>
                  </span>
                </div>
                {recruitment.description?.trim() ? (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-[#7a8a76]">
                    {recruitment.description.trim()}
                  </p>
                ) : null}
              </div>
            </div>

            {/* 左: 01+03 / 右: 02 — 高さバランスを取る */}
            <div className="grid shrink-0 grid-cols-1 items-start gap-2 min-[1000px]:grid-cols-2">
              <div className="flex flex-col gap-2">
                {profileSectionIndex && profileFields.length > 0 ? (
                  <SectionCard
                    id="af-section-profile"
                    index={profileSectionIndex}
                    title="基本プロフィール"
                    hint="登録情報から取得"
                  >
                    {profileFields.some((f) => f.id === "name") ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-[#1a2818]">名前</span>
                            <FieldBadge auto />
                          </div>
                          <p className="rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-1.5 text-[12px] font-medium text-[#1a2818]">
                            {profile.displayName || "未設定"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-[#1a2818]">メール</span>
                            <FieldBadge auto />
                          </div>
                          <p className="truncate rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-1.5 text-[12px] font-medium text-[#1a2818]">
                            {email || "—"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {(() => {
                      const ageEnabled = profileFields.some((f) => f.id === "age");
                      if (!phoneEnabled && !ageEnabled) return null;
                      const phoneBlock = phoneEnabled ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <label
                              className="text-[11px] font-medium text-[#1a2818]"
                              htmlFor="af-phone"
                            >
                              電話番号
                            </label>
                            <FieldBadge
                              auto={profileFields.find((f) => f.id === "phone")?.autoFromProfile}
                              required={profileFields.find((f) => f.id === "phone")?.required}
                            />
                          </div>
                          {profileFields.find((f) => f.id === "phone")?.autoFromProfile ? (
                            <p className="rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-1.5 text-[12px] text-[#566358]">
                              {profile.phone?.trim() || "プロフィール未登録"}
                            </p>
                          ) : (
                            <input
                              id="af-phone"
                              type="tel"
                              value={phoneValue}
                              onChange={(e) => onChange("phone", e.target.value)}
                              placeholder="090-0000-0000"
                              className={inputClass}
                            />
                          )}
                        </div>
                      ) : null;
                      const ageBlock = ageEnabled ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-[#1a2818]">年齢</span>
                            <FieldBadge
                              auto
                              required={profileFields.find((f) => f.id === "age")?.required}
                            />
                          </div>
                          <p className="rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-1.5 text-[12px] text-[#566358]">
                            プロフィールから参照されます
                          </p>
                        </div>
                      ) : null;
                      return (
                        <div
                          className={
                            phoneEnabled && ageEnabled ? "grid grid-cols-2 gap-2" : undefined
                          }
                        >
                          {phoneBlock}
                          {ageBlock}
                        </div>
                      );
                    })()}

                    {profileFields.some((f) => f.id === "portrait") ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-medium text-[#1a2818]">顔写真</span>
                          <FieldBadge
                            required={profileFields.find((f) => f.id === "portrait")?.required}
                          />
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-2">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d8e0d4] bg-white text-[13px] font-semibold text-[#3a633d]">
                            {profile.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={profile.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[#566358]">
                              {profile.avatarUrl
                                ? "登録中の画像を顔写真として利用します"
                                : "顔写真が未設定です。プロフィールで登録してください"}
                            </p>
                            <Link
                              href="/profile/edit"
                              className="mt-1 inline-flex text-[11px] font-medium text-[#2B3A6B] underline-offset-2 hover:underline"
                            >
                              顔写真を変更
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </SectionCard>
                ) : null}

                {extraSectionIndex ? (
                  <SectionCard
                    id="af-section-extra"
                    index={extraSectionIndex}
                    title="追加確認"
                  >
                    <div className="space-y-2">
                      {extraFields.map((field) => {
                        if (field.id === "terms") {
                          return (
                            <label
                              key={field.id}
                              className="flex cursor-pointer items-start gap-2 rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-2"
                            >
                              <input
                                type="checkbox"
                                checked={answers.terms === true || answers.terms === "true"}
                                onChange={(e) => onChange("terms", e.target.checked)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-[#c5d4c0] text-[#6BBF3E]"
                              />
                              <span className="text-[11px] leading-snug text-[#1a2818]">
                                {field.label}
                                {field.required ? (
                                  <span className="ml-1 align-middle">
                                    <FieldBadge required />
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        }
                        const fieldValue =
                          typeof answers[field.id] === "string"
                            ? (answers[field.id] as string)
                            : "";
                        return (
                          <div key={field.id} className="space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <label
                                className="text-[11px] font-medium text-[#1a2818]"
                                htmlFor={`af-${field.id}`}
                              >
                                {field.label}
                              </label>
                              <FieldBadge required={field.required} />
                            </div>
                            <input
                              id={`af-${field.id}`}
                              type="text"
                              value={fieldValue}
                              onChange={(e) => onChange(field.id, e.target.value)}
                              placeholder={
                                field.id === "emergency_contact"
                                  ? "電話番号・続柄"
                                  : field.placeholder
                              }
                              className={inputClass}
                            />
                          </div>
                        );
                      })}
                      {customQuestions.map((q) => (
                        <div key={q.id} className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <label
                              className="text-[11px] font-medium text-[#1a2818]"
                              htmlFor={`af-cq-${q.id}`}
                            >
                              {q.label}
                            </label>
                            <FieldBadge required={q.required} />
                          </div>
                          {q.answerType === "select" && q.options && q.options.length > 0 ? (
                            <select
                              id={`af-cq-${q.id}`}
                              value={
                                typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""
                              }
                              onChange={(e) => onChange(q.id, e.target.value)}
                              className={inputClass}
                            >
                              <option value="">選択してください</option>
                              {q.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`af-cq-${q.id}`}
                              type="text"
                              value={
                                typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""
                              }
                              onChange={(e) => onChange(q.id, e.target.value)}
                              className={inputClass}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}
              </div>

              {applicationSectionIndex && applicationFields.length > 0 ? (
                <SectionCard
                  id="af-section-application"
                  index={applicationSectionIndex}
                  title="今回の応募について"
                  hint="この募集ごとに聞く内容"
                >
                  {applicationFields.map(renderApplicationField)}
                </SectionCard>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[12px] text-red-600">
                {error}
              </p>
            ) : null}
            </div>
          </div>

          <aside className="w-[200px] shrink-0">
            <div className="sticky top-0 space-y-2">
              <div className="rounded-[10px] border border-[#e8e6e0] bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#1a2818]">入力の進捗</p>
                  <span className="text-[11px] tabular-nums text-[#566358]">
                    {filled}/{progressItems.length}
                  </span>
                </div>
                <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-[#eef0ea]">
                  <div
                    className="h-full rounded-full bg-[#6BBF3E] transition-all duration-500"
                    style={{
                      width: `${Math.round((filled / Math.max(progressItems.length, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <ul className="space-y-0.5">
                  {progressItems.map(({ key, done, focusId }) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => focusSection(focusId)}
                        className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-[#f5f4f0]"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            done
                              ? "bg-[#6BBF3E] text-white"
                              : "border border-[#d8e0d4] bg-white"
                          )}
                          aria-hidden
                        >
                          {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[11px]",
                            done ? "text-[#1a2818]" : "text-[#8a9e80]"
                          )}
                        >
                          {key}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 rounded-[10px] border border-[#e8e6e0] bg-white p-3">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={savingDraft || submitting}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[#d8e0d4] bg-white px-2 text-[12px] font-medium text-[#2d4a28] hover:bg-[#f3faf0] disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  {savingDraft ? "保存中…" : draftSaved ? "下書き保存済み" : "下書き保存"}
                </button>
                <button
                  type="submit"
                  disabled={submitting || savingDraft}
                  onClick={(e) => {
                    if (remaining > 0 && nextIncomplete) {
                      e.preventDefault();
                      focusSection(nextIncomplete.focusId);
                    }
                  }}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#6BBF3E] px-2 text-[12px] font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {submitting ? "応募中…" : remaining > 0 ? "未入力を確認" : "応募する"}
                </button>
                {remaining === 0 ? (
                  <p className="pt-0.5 text-center text-[10px] leading-relaxed text-[#3a633d]">
                    必須はすべて入力済みです
                  </p>
                ) : (
                  <p className="pt-0.5 text-center text-[10px] leading-relaxed text-[#8a9e80]">
                    次は「{nextIncomplete?.key}」です
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
