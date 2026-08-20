"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ApplicationFormConfig,
  type ApplicationFormFieldDef,
  type CustomQuestion,
  newCustomQuestionId,
} from "@/lib/recruitment-application-form";

type Props = {
  config: ApplicationFormConfig;
  onChange: (next: ApplicationFormConfig) => void;
};

function SectionCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-[#e8e6e0] bg-white", className)}>
      <div className="border-b border-[#f0f2ec] px-3 py-2">
        <h3 className="text-[13px] font-semibold text-[#1a2818]">{title}</h3>
        {hint ? <p className="mt-0.5 text-[10px] text-[#8a9e80]">{hint}</p> : null}
      </div>
      <div className="divide-y divide-[#f0f2ec]">{children}</div>
    </section>
  );
}

function RequiredToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 text-[10px]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span className="text-[#8a9e80]">必須</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          checked ? "bg-[#6BBF3E]" : "bg-[#d8d6d0]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
            checked ? "left-3.5" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}

function FieldRow({
  field,
  onToggleEnabled,
  onToggleRequired,
  onPlaceholderChange,
}: {
  field: ApplicationFormFieldDef;
  onToggleEnabled: () => void;
  onToggleRequired: (v: boolean) => void;
  onPlaceholderChange?: (v: string) => void;
}) {
  return (
    <div className="px-3 py-1.5">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="checkbox"
            checked={field.enabled}
            disabled={field.locked}
            onChange={onToggleEnabled}
            className="h-3.5 w-3.5 rounded border-[#d0d6cc] text-[#3d6b2f] focus:ring-[#6BBF3E]"
          />
          <span className="truncate text-[12px] font-medium text-[#1a2818]">{field.label}</span>
          {field.locked ? (
            <span className="shrink-0 rounded bg-[#eef3ea] px-1 py-0.5 text-[8px] font-semibold text-[#3a7a10]">
              固定
            </span>
          ) : null}
          {field.autoFromProfile && !field.locked ? (
            <span className="shrink-0 rounded bg-[#eef3ea] px-1 py-0.5 text-[8px] font-semibold text-[#3a7a10]">
              自動
            </span>
          ) : null}
        </label>
        {!field.locked ? (
          <RequiredToggle
            checked={field.required}
            disabled={!field.enabled}
            onChange={onToggleRequired}
          />
        ) : (
          <span className="shrink-0 text-[10px] text-[#8a9e80]">常時</span>
        )}
      </div>
      {field.id === "message" && field.enabled && onPlaceholderChange ? (
        <input
          type="text"
          value={field.placeholder ?? ""}
          onChange={(e) => onPlaceholderChange(e.target.value)}
          placeholder="応募者への案内文"
          className="mt-1 w-full rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2 py-1 text-[11px] outline-none focus:border-[#2B3A6B] focus:bg-white"
        />
      ) : null}
    </div>
  );
}

export function ApplicationFormSettingsPc({ config, onChange }: Props) {
  const updateField = (id: string, patch: Partial<ApplicationFormFieldDef>) => {
    onChange({
      ...config,
      fields: config.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const setCustom = (customQuestions: CustomQuestion[]) => {
    onChange({ ...config, customQuestions });
  };

  const bindField = (field: ApplicationFormFieldDef) => (
    <FieldRow
      key={field.id}
      field={field}
      onToggleEnabled={() => {
        if (field.locked) return;
        const enabled = !field.enabled;
        updateField(field.id, {
          enabled,
          required: enabled ? field.required : false,
        });
      }}
      onToggleRequired={(required) => updateField(field.id, { required })}
      onPlaceholderChange={
        field.id === "message"
          ? (placeholder) => updateField(field.id, { placeholder })
          : undefined
      }
    />
  );

  const profile = config.fields.filter((f) => f.section === "profile");
  const application = config.fields.filter((f) => f.section === "application");
  const extra = config.fields.filter((f) => f.section === "extra");

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1a2818]">応募フォームの設定</h2>
          <p className="mt-0.5 text-[11px] text-[#8a9e80]">
            聞く項目と必須を選びます。あとから変更できます。
          </p>
        </div>
        <p className="rounded-md border border-[#d8ecd0] bg-[#f3faf0] px-2 py-1 text-[10px] text-[#3a633d]">
          選んだ項目が応募画面に表示されます
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 min-[1100px]:grid-cols-2">
        <SectionCard
          title="基本プロフィール"
          hint="名前は登録情報から。電話・年齢は応募時に入力"
        >
          {profile.map(bindField)}
        </SectionCard>

        <SectionCard title="今回の応募について" hint="この募集ごとに聞く内容">
          {application.map(bindField)}
        </SectionCard>

        <SectionCard title="追加確認">{extra.map(bindField)}</SectionCard>

        <section className="rounded-lg border border-[#e8e6e0] bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-[#f0f2ec] px-3 py-2">
            <div>
              <h3 className="text-[13px] font-semibold text-[#1a2818]">カスタム質問</h3>
              <p className="mt-0.5 text-[10px] text-[#8a9e80]">任意で追加</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCustom([
                  ...config.customQuestions,
                  {
                    id: newCustomQuestionId(),
                    label: "",
                    answerType: "text",
                    required: false,
                  },
                ])
              }
              className="inline-flex items-center gap-1 rounded-md border border-[#e8e6e0] bg-white px-2 py-1 text-[11px] font-medium text-[#3a3428] hover:bg-[#f5f4f0]"
            >
              <Plus className="h-3 w-3" aria-hidden />
              追加
            </button>
          </div>

          {config.customQuestions.length === 0 ? (
            <p className="px-3 py-3 text-center text-[11px] text-[#8a9e80]">質問なし</p>
          ) : (
            <div className="divide-y divide-[#f0f2ec]">
              {config.customQuestions.map((q, index) => (
                <div key={q.id} className="space-y-1.5 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => {
                        const next = [...config.customQuestions];
                        next[index] = { ...q, label: e.target.value };
                        setCustom(next);
                      }}
                      placeholder="質問文"
                      className="min-w-0 flex-1 rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2 py-1 text-[12px] outline-none focus:border-[#2B3A6B] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCustom(config.customQuestions.filter((x) => x.id !== q.id))
                      }
                      className="rounded-md border border-[#e8e6e0] px-2 py-1 text-[10px] font-medium text-[#8a9e80] hover:bg-[#f5f4f0] hover:text-[#a33a2c]"
                    >
                      削除
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] text-[#526448]">
                      形式
                      <select
                        value={q.answerType}
                        onChange={(e) => {
                          const next = [...config.customQuestions];
                          next[index] = {
                            ...q,
                            answerType: e.target.value === "select" ? "select" : "text",
                          };
                          setCustom(next);
                        }}
                        className="rounded-md border border-[#e8e6e0] bg-white px-1.5 py-0.5 text-[11px]"
                      >
                        <option value="text">自由記述</option>
                        <option value="select">選択式</option>
                      </select>
                    </label>
                    <RequiredToggle
                      checked={q.required}
                      onChange={(required) => {
                        const next = [...config.customQuestions];
                        next[index] = { ...q, required };
                        setCustom(next);
                      }}
                    />
                  </div>
                  {q.answerType === "select" ? (
                    <input
                      type="text"
                      value={(q.options ?? []).join("、")}
                      onChange={(e) => {
                        const options = e.target.value
                          .split(/[、,]/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const next = [...config.customQuestions];
                        next[index] = { ...q, options };
                        setCustom(next);
                      }}
                      placeholder="選択肢（読点区切り）"
                      className="w-full rounded-md border border-[#e8e6e0] bg-[#fafaf8] px-2 py-1 text-[11px] outline-none focus:border-[#2B3A6B] focus:bg-white"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
