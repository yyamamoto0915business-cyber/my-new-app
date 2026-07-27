"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { User, FileText, CheckCircle2 } from "lucide-react";
import {
  type ApplicationFormAnswers,
  type ApplicationFormConfig,
  type ApplicationFormFieldDef,
  type ApplicationFormFieldId,
  type CustomQuestion,
} from "@/lib/recruitment-application-form";
import type {
  ApplicationFormProfile,
  ApplicationFormRecruitmentSummary,
} from "@/components/recruitments/ApplicationFormPcView";
import { cn } from "@/lib/utils";

type Props = {
  recruitment: ApplicationFormRecruitmentSummary;
  config: ApplicationFormConfig;
  answers: ApplicationFormAnswers;
  profile: ApplicationFormProfile;
  email?: string | null;
  error?: string | null;
  submitting: boolean;
  savingDraft: boolean;
  draftSaved: boolean;
  /** プレビュー用：ブレークポイントに関係なく表示 */
  forceShow?: boolean;
  onChange: (id: string, value: string | boolean) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

type StepKey = "profile" | "application" | "confirm";

const TEXT_AREA_IDS = new Set<ApplicationFormFieldId>([
  "message",
  "experience",
  "self_intro",
]);

const inp =
  "w-full min-w-0 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";

function Card({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white p-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 text-[13px] font-[600] text-[#1a1a1a]">
        {icon}
        {title}
      </div>
      <p className="mb-1.5 text-[11px] text-[#888]">{sub}</p>
      {children}
    </div>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 last:mb-0">{children}</div>;
}

function Fl({
  label,
  required,
  auto,
  opt,
}: {
  label: string;
  required?: boolean;
  auto?: boolean;
  opt?: boolean;
}) {
  return (
    <div className="mb-[5px] flex items-center gap-[5px] text-[13px] font-[500] text-[#1a1a1a]">
      {label}
      {auto ? (
        <span className="rounded-[4px] bg-[#eef3ea] px-[5px] py-[1px] text-[9px] font-[600] text-[#3a7a10]">
          自動
        </span>
      ) : required ? (
        <span className="rounded-[4px] bg-[#FEF2F2] px-[5px] py-[1px] text-[9px] font-[600] text-[#E8708A]">
          必須
        </span>
      ) : opt ? (
        <span className="text-[10px] text-[#888]">任意</span>
      ) : null}
    </div>
  );
}

function SRow({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-[10px] border-b border-[#f5f3ef] py-[8px] last:border-b-0">
      <div className="w-[72px] shrink-0 text-[11px] text-[#888]">{label}</div>
      <div
        className="flex-1 text-right text-[12px] leading-[1.5]"
        style={{
          color: empty ? "#ccc" : "#1a1a1a",
          fontWeight: empty ? 400 : 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StepIndicator({
  steps,
  current,
  onGo,
}: {
  steps: { key: StepKey; label: string; n: number }[];
  current: StepKey;
  onGo: (key: StepKey) => void;
}) {
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = currentIdx > i;
        const isActive = step.key === current;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onGo(step.key)}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-[3px] rounded-lg transition-colors hover:bg-[#f5f4f0]"
            >
              <div
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-[700] transition-all"
                style={{
                  background: isDone || isActive ? "#6BBF3E" : "#F3F2EF",
                  color: isDone || isActive ? "#fff" : "#999",
                  border: isDone || isActive ? "none" : "1.5px solid #e8e6e0",
                }}
              >
                {isDone ? (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <div
                className="whitespace-nowrap text-[9px]"
                style={{
                  color: isDone ? "#6BBF3E" : isActive ? "#2B3A6B" : "#999",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {step.label}
              </div>
            </button>
            {i < steps.length - 1 ? (
              <div
                className="mx-[4px] mb-[14px] h-[1.5px] flex-1"
                style={{ background: currentIdx > i ? "#6BBF3E" : "#e8e6e0" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function answerDisplay(
  field: ApplicationFormFieldDef,
  answers: ApplicationFormAnswers,
  profile: ApplicationFormProfile,
  email?: string | null
): string {
  if (field.id === "name") {
    const name = profile.displayName?.trim() || "未設定";
    return email ? `${name}（${email}）` : name;
  }
  if (field.id === "phone") {
    const v =
      (typeof answers.phone === "string" && answers.phone.trim()) ||
      profile.phone?.trim() ||
      "";
    return v || "未登録";
  }
  if (field.id === "age") return "プロフィール参照";
  if (field.id === "portrait") {
    return profile.avatarUrl ? "設定済み" : "未設定";
  }
  if (field.id === "terms") {
    return answers.terms === true || answers.terms === "true" ? "同意済み" : "未同意";
  }
  const v = answers[field.id];
  if (typeof v === "string" && v.trim()) return v.trim();
  return "未入力";
}

export function ApplicationFormMobileView({
  recruitment,
  config,
  answers,
  profile,
  email,
  error,
  submitting,
  savingDraft,
  draftSaved,
  forceShow,
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
  const roleOptions = recruitment.roles.map((r) => r.name.trim()).filter(Boolean);

  const steps = useMemo(() => {
    const list: { key: StepKey; label: string; n: number }[] = [];
    let n = 1;
    if (profileFields.length > 0) {
      list.push({ key: "profile", label: "プロフィール", n: n++ });
    }
    if (applicationFields.length > 0) {
      list.push({ key: "application", label: "応募内容", n: n++ });
    }
    list.push({ key: "confirm", label: "確認・提出", n: n++ });
    return list;
  }, [profileFields.length, applicationFields.length]);

  const [step, setStep] = useState<StepKey>(steps[0]?.key ?? "confirm");

  useEffect(() => {
    if (!steps.some((s) => s.key === step)) {
      setStep(steps[0]?.key ?? "confirm");
    }
  }, [steps, step]);

  const stepIndex = steps.findIndex((s) => s.key === step);
  const isFirst = stepIndex <= 0;
  const isLast = step === "confirm";

  const goNext = () => {
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1].key);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStep(steps[stepIndex - 1].key);
    else onBack();
  };

  const phoneField = profileFields.find((f) => f.id === "phone");
  const ageField = profileFields.find((f) => f.id === "age");

  const renderApplicationField = (field: ApplicationFormFieldDef) => {
    if (field.id === "desired_role") {
      return (
        <FieldWrap key={field.id}>
          <Fl label={field.label} required={field.required} opt={!field.required} />
          {roleOptions.length > 0 ? (
            <select
              value={typeof answers.desired_role === "string" ? answers.desired_role : ""}
              onChange={(e) => onChange("desired_role", e.target.value)}
              className={inp}
            >
              <option value="">選択してください</option>
              {roleOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={typeof answers.desired_role === "string" ? answers.desired_role : ""}
              onChange={(e) => onChange("desired_role", e.target.value)}
              placeholder="希望する役割"
              className={inp}
            />
          )}
        </FieldWrap>
      );
    }

    if (field.id === "available_time") {
      const timeValue =
        typeof answers.available_time === "string" ? answers.available_time : "";
      const noteValue =
        typeof answers.available_time_note === "string"
          ? answers.available_time_note
          : "";
      return (
        <FieldWrap key={field.id}>
          <Fl label={field.label} required={field.required} opt={!field.required} />
          <select
            value={timeValue}
            onChange={(e) => onChange("available_time", e.target.value)}
            className={inp}
          >
            <option value="">選択してください</option>
            <option value="終日参加可">終日参加可</option>
            <option value="午前のみ">午前のみ</option>
            <option value="午後のみ">午後のみ</option>
          </select>
          <div className="mt-[10px]">
            <Fl label="その他の希望時間" opt />
            <input
              type="text"
              value={noteValue}
              onChange={(e) => onChange("available_time_note", e.target.value)}
              placeholder="例：10:00〜14:00"
              className={inp}
            />
          </div>
        </FieldWrap>
      );
    }

    const isArea = TEXT_AREA_IDS.has(field.id);
    const fieldValue =
      typeof answers[field.id] === "string" ? (answers[field.id] as string) : "";
    const placeholder =
      field.id === "self_intro"
        ? field.placeholder ||
          "簡単な自己紹介や、ボランティアへの想いがあれば入力してください"
        : field.placeholder;

    return (
      <FieldWrap key={field.id}>
        <Fl label={field.label} required={field.required} opt={!field.required} />
        {isArea ? (
          <textarea
            id={`field-${field.id}`}
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={placeholder}
            rows={field.id === "message" ? 4 : 3}
            className={cn(inp, "resize-none")}
          />
        ) : (
          <input
            id={`field-${field.id}`}
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={placeholder}
            className={inp}
          />
        )}
      </FieldWrap>
    );
  };

  const renderExtraField = (field: ApplicationFormFieldDef) => {
    if (field.id === "terms") {
      return (
        <label
          key={field.id}
          className="mb-[14px] flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[12px] py-[12px] last:mb-0"
        >
          <input
            type="checkbox"
            checked={answers.terms === true || answers.terms === "true"}
            onChange={(e) => onChange("terms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#c5d4c0] text-[#6BBF3E]"
          />
          <span className="text-[13px] text-[#1a1a1a]">
            {field.label}
            {field.required ? (
              <span className="ml-1 rounded-[4px] bg-[#FEF2F2] px-[5px] py-[1px] text-[9px] font-[600] text-[#E8708A]">
                必須
              </span>
            ) : null}
          </span>
        </label>
      );
    }

    const fieldValue =
      typeof answers[field.id] === "string" ? (answers[field.id] as string) : "";
    return (
      <FieldWrap key={field.id}>
        <Fl label={field.label} required={field.required} opt={!field.required} />
        <input
          type="text"
          value={fieldValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || "電話番号・続柄"}
          className={inp}
        />
      </FieldWrap>
    );
  };

  const renderCustomQuestion = (q: CustomQuestion) => (
    <FieldWrap key={q.id}>
      <Fl label={q.label} required={q.required} opt={!q.required} />
      {q.answerType === "select" && q.options && q.options.length > 0 ? (
        <select
          value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          className={inp}
        >
          <option value="">選択してください</option>
          {q.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <textarea
          value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
          onChange={(e) => onChange(q.id, e.target.value)}
          rows={3}
          className={cn(inp, "resize-none")}
        />
      )}
    </FieldWrap>
  );

  const stepTitle =
    step === "profile"
      ? "基本プロフィール"
      : step === "application"
        ? "応募内容"
        : "確認・提出";

  return (
    <div
      className={cn(
        "flex flex-col bg-white",
        forceShow ? "min-h-full" : "min-h-screen min-[900px]:hidden"
      )}
    >
      {/* Header — 作成画面と同型 */}
      <div
        className={cn(
          "sticky z-10 border-b border-[#e8e6e0] bg-white",
          forceShow ? "top-0" : "top-[var(--mg-mobile-top-header-h)]"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F2EF]"
            aria-label="戻る"
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
          <div className="min-w-0 flex-1 truncate text-[13px] font-[600] text-[#1a1a1a]">
            {stepTitle}
          </div>
        </div>
        {steps.length > 1 ? (
          <div className="px-4 pb-2">
            <StepIndicator steps={steps} current={step} onGo={setStep} />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mx-[14px] mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 px-[14px] py-[12px] pb-4">
          {step === "profile" ? (
            <Card
              title="基本プロフィール"
              sub="登録情報から取得します"
              icon={<User className="h-3.5 w-3.5 text-[#2B3A6B]" strokeWidth={2} />}
            >
              {profileFields.some((f) => f.id === "name") ? (
                <FieldWrap>
                  <Fl label="名前" auto />
                  <div className="rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px]">
                    <p className="text-[13px] font-[500] text-[#1a1a1a]">
                      {profile.displayName || "未設定"}
                    </p>
                    {email ? (
                      <p className="mt-0.5 truncate text-[11px] text-[#888]">{email}</p>
                    ) : null}
                  </div>
                </FieldWrap>
              ) : null}

              {phoneField || ageField ? (
                <div
                  className={cn(
                    "mb-3",
                    phoneField && ageField ? "grid grid-cols-2 gap-2" : undefined
                  )}
                >
                  {phoneField ? (
                    <div>
                      <Fl
                        label="電話番号"
                        auto={phoneField.autoFromProfile}
                        required={phoneField.required && !phoneField.autoFromProfile}
                        opt={!phoneField.required && !phoneField.autoFromProfile}
                      />
                      <div className="rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#566358]">
                        {profile.phone?.trim() || "未登録"}
                      </div>
                    </div>
                  ) : null}
                  {ageField ? (
                    <div>
                      <Fl label="年齢" auto />
                      <div className="rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#566358]">
                        プロフィールから参照
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {profileFields.some((f) => f.id === "portrait") ? (
                <FieldWrap>
                  <Fl
                    label="顔写真"
                    required={profileFields.find((f) => f.id === "portrait")?.required}
                    opt={!profileFields.find((f) => f.id === "portrait")?.required}
                  />
                  <div className="flex items-center gap-3 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[12px] py-[10px]">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white text-sm font-semibold text-[#3a633d]">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (profile.displayName || "?").slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-[#566358]">
                        {profile.avatarUrl
                          ? "登録中の画像を顔写真として利用します"
                          : "顔写真が未設定です"}
                      </p>
                      <Link
                        href="/profile/edit"
                        className="mt-1 inline-flex text-[12px] font-medium text-[#2B3A6B] underline-offset-2 hover:underline"
                      >
                        顔写真を変更
                      </Link>
                    </div>
                  </div>
                </FieldWrap>
              ) : null}
            </Card>
          ) : null}

          {step === "application" ? (
            <Card
              title="今回の応募について"
              sub="この募集ごとに聞く内容です"
              icon={<FileText className="h-3.5 w-3.5 text-[#2B3A6B]" strokeWidth={2} />}
            >
              {applicationFields.map(renderApplicationField)}
            </Card>
          ) : null}

          {step === "confirm" ? (
            <>
              {profileFields.length > 0 ? (
                <div className="mb-1.5 rounded-[10px] border border-[#e8e6e0] bg-white p-2.5">
                  <div className="mb-1 flex justify-between text-[11px] font-[600] text-[#888]">
                    基本プロフィール
                    {steps.some((s) => s.key === "profile") ? (
                      <button
                        type="button"
                        onClick={() => setStep("profile")}
                        className="font-[500] text-[#2B3A6B]"
                      >
                        編集
                      </button>
                    ) : null}
                  </div>
                  {profileFields.map((f) => {
                    const val = answerDisplay(f, answers, profile, email);
                    return (
                      <SRow
                        key={f.id}
                        label={f.id === "name" ? "名前" : f.label}
                        value={val}
                        empty={val === "未入力" || val === "未設定" || val === "未登録"}
                      />
                    );
                  })}
                </div>
              ) : null}

              {applicationFields.length > 0 ? (
                <div className="mb-1.5 rounded-[10px] border border-[#e8e6e0] bg-white p-2.5">
                  <div className="mb-1 flex justify-between text-[11px] font-[600] text-[#888]">
                    応募内容
                    {steps.some((s) => s.key === "application") ? (
                      <button
                        type="button"
                        onClick={() => setStep("application")}
                        className="font-[500] text-[#2B3A6B]"
                      >
                        編集
                      </button>
                    ) : null}
                  </div>
                  {applicationFields.map((f) => {
                    let val = answerDisplay(f, answers, profile, email);
                    if (
                      f.id === "available_time" &&
                      typeof answers.available_time_note === "string" &&
                      answers.available_time_note.trim()
                    ) {
                      val = `${val}（${answers.available_time_note.trim()}）`;
                    }
                    return (
                      <SRow
                        key={f.id}
                        label={f.label}
                        value={val}
                        empty={val === "未入力"}
                      />
                    );
                  })}
                </div>
              ) : null}

              {extraFields.length > 0 || customQuestions.length > 0 ? (
                <Card
                  title="追加確認"
                  sub="同意と追加の確認事項です"
                  icon={
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2B3A6B]" strokeWidth={2} />
                  }
                >
                  {extraFields.map(renderExtraField)}
                  {customQuestions.map(renderCustomQuestion)}
                </Card>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Footer — 作成画面と同型 */}
        <div className="sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {!isLast ? (
            <div className="flex items-center gap-1.5">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-[9px] border border-[#e8e6e0] bg-white px-2.5 text-[12px] font-[500]"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  戻る
                </button>
              ) : null}
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={savingDraft || submitting}
                className="inline-flex h-9 shrink-0 items-center rounded-[9px] border border-[#e8e6e0] bg-white px-2.5 text-[12px] font-[500] disabled:opacity-50"
              >
                {savingDraft ? "保存中…" : draftSaved ? "保存済み" : "下書き"}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-[9px] border-none bg-[#2B3A6B] px-2.5 text-[12px] font-[600] text-white"
              >
                <span className="truncate">次へ</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-[8px]">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex items-center gap-[5px] rounded-[10px] border border-[#e8e6e0] bg-white px-[14px] py-[11px] text-[13px] font-[500]"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  戻る
                </button>
              ) : null}
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={savingDraft || submitting}
                className="rounded-[10px] border border-[#e8e6e0] bg-white px-[12px] py-[11px] text-[13px] font-[500] disabled:opacity-50"
              >
                {savingDraft ? "保存中…" : draftSaved ? "保存済み" : "下書き"}
              </button>
              <button
                type="submit"
                disabled={submitting || savingDraft}
                className="flex flex-1 items-center justify-center gap-[5px] rounded-[10px] bg-[#6BBF3E] py-[11px] text-[13px] font-[600] text-white transition disabled:opacity-50"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {submitting ? "提出中…" : "提出する"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
