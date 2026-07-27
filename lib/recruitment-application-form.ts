/** スタッフ募集の応募フォーム設定（主催者PC作成フロー） */

export type ApplicationFormFieldId =
  | "name"
  | "phone"
  | "age"
  | "portrait"
  | "desired_role"
  | "available_time"
  | "message"
  | "experience"
  | "self_intro"
  | "terms"
  | "emergency_contact";

export type ApplicationFormFieldDef = {
  id: ApplicationFormFieldId;
  label: string;
  section: "profile" | "application" | "extra";
  /** 常にON・OFF不可 */
  locked?: boolean;
  /** プロフィールから自動取得 */
  autoFromProfile?: boolean;
  enabled: boolean;
  required: boolean;
  /** メッセージ欄の案内文など */
  placeholder?: string;
};

export type CustomQuestionAnswerType = "text" | "select";

export type CustomQuestion = {
  id: string;
  label: string;
  answerType: CustomQuestionAnswerType;
  required: boolean;
  options?: string[];
};

export type ApplicationFormConfig = {
  fields: ApplicationFormFieldDef[];
  customQuestions: CustomQuestion[];
};

const FIELD_META: Record<
  ApplicationFormFieldId,
  Omit<ApplicationFormFieldDef, "enabled" | "required" | "placeholder">
> = {
  name: {
    id: "name",
    label: "名前・プロフィール画像",
    section: "profile",
    locked: true,
    autoFromProfile: true,
  },
  phone: { id: "phone", label: "電話番号", section: "profile", autoFromProfile: true },
  age: { id: "age", label: "年齢", section: "profile", autoFromProfile: true },
  portrait: { id: "portrait", label: "顔写真", section: "profile" },
  desired_role: { id: "desired_role", label: "希望役割", section: "application" },
  available_time: { id: "available_time", label: "参加可能時間", section: "application" },
  message: { id: "message", label: "応募メッセージ", section: "application" },
  experience: { id: "experience", label: "経験・スキル", section: "application" },
  self_intro: { id: "self_intro", label: "自己紹介", section: "application" },
  terms: { id: "terms", label: "規約への同意", section: "extra" },
  emergency_contact: { id: "emergency_contact", label: "緊急連絡先", section: "extra" },
};

/** モックに近い初期設定 */
export function createDefaultApplicationFormConfig(): ApplicationFormConfig {
  return {
    fields: [
      { ...FIELD_META.name, enabled: true, required: true },
      { ...FIELD_META.phone, enabled: false, required: false },
      { ...FIELD_META.age, enabled: false, required: false },
      { ...FIELD_META.portrait, enabled: false, required: false },
      { ...FIELD_META.desired_role, enabled: true, required: true },
      { ...FIELD_META.available_time, enabled: true, required: true },
      {
        ...FIELD_META.message,
        enabled: true,
        required: true,
        placeholder: "当日の交通手段や、一言メッセージがあれば入力してください",
      },
      { ...FIELD_META.experience, enabled: false, required: false },
      { ...FIELD_META.self_intro, enabled: false, required: false },
      { ...FIELD_META.terms, enabled: true, required: true },
      { ...FIELD_META.emergency_contact, enabled: false, required: false },
    ],
    customQuestions: [],
  };
}

export function parseApplicationFormConfig(raw: unknown): ApplicationFormConfig {
  const fallback = createDefaultApplicationFormConfig();
  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as { fields?: unknown; customQuestions?: unknown };
  const byId = new Map(
    (Array.isArray(obj.fields) ? obj.fields : [])
      .filter((f): f is Record<string, unknown> => f != null && typeof f === "object")
      .map((f) => [String(f.id), f] as const)
  );

  const fields = fallback.fields.map((def) => {
    const saved = byId.get(def.id);
    if (!saved) return def;
    const enabled = def.locked ? true : Boolean(saved.enabled ?? def.enabled);
    const required = def.locked ? true : Boolean(saved.required ?? def.required);
    const placeholder =
      typeof saved.placeholder === "string" ? saved.placeholder : def.placeholder;
    return { ...def, enabled, required, placeholder };
  });

  const customQuestions: CustomQuestion[] = Array.isArray(obj.customQuestions)
    ? obj.customQuestions
        .filter((q): q is Record<string, unknown> => q != null && typeof q === "object")
        .map((q, i) => ({
          id: typeof q.id === "string" && q.id ? q.id : `cq-${i}-${Date.now()}`,
          label: typeof q.label === "string" ? q.label : "",
          answerType: q.answerType === "select" ? "select" : "text",
          required: Boolean(q.required),
          options: Array.isArray(q.options)
            ? q.options.filter((o): o is string => typeof o === "string")
            : undefined,
        }))
    : [];

  return { fields, customQuestions };
}

export function enabledApplicationFormItems(config: ApplicationFormConfig): {
  label: string;
  badge: "required" | "auto" | "optional";
}[] {
  const items: { label: string; badge: "required" | "auto" | "optional" }[] = [];
  for (const f of config.fields) {
    if (!f.enabled) continue;
    items.push({
      label: f.label,
      badge: f.autoFromProfile && f.locked ? "auto" : f.required ? "required" : "optional",
    });
  }
  for (const q of config.customQuestions) {
    if (!q.label.trim()) continue;
    items.push({
      label: q.label.trim(),
      badge: q.required ? "required" : "optional",
    });
  }
  return items;
}

export function newCustomQuestionId(): string {
  return `cq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** フィールドID / カスタム質問ID → 値 */
export type ApplicationFormAnswers = Record<string, string | boolean | null>;

export function resolveApplicationFormConfig(
  raw: ApplicationFormConfig | null | undefined
): ApplicationFormConfig {
  return raw ?? createDefaultApplicationFormConfig();
}

/** プロフィール自動以外の入力項目があるか */
export function applicationFormNeedsInput(config: ApplicationFormConfig): boolean {
  const hasManualField = config.fields.some((f) => f.enabled && !f.autoFromProfile);
  const hasCustom = config.customQuestions.some((q) => q.label.trim().length > 0);
  return hasManualField || hasCustom;
}

/** 入力が必要な項目ラベル（自動取得を除く） */
export function getManualFormInputLabels(config: ApplicationFormConfig): string[] {
  return enabledApplicationFormItems(config)
    .filter((i) => i.badge !== "auto")
    .map((i) => i.label);
}

export function parseApplicationFormAnswers(raw: unknown): ApplicationFormAnswers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ApplicationFormAnswers = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (typeof value === "number") {
      out[key] = String(value);
    }
  }
  return out;
}

export function validateApplicationFormAnswers(
  config: ApplicationFormConfig,
  answers: ApplicationFormAnswers
): string | null {
  for (const f of config.fields) {
    if (!f.enabled || !f.required || f.autoFromProfile) continue;
    // 顔写真はプロフィール画像を参照（answers には保存しない）
    if (f.id === "portrait") continue;
    if (f.id === "terms") {
      if (answers.terms !== true && answers.terms !== "true") {
        return `${f.label}に同意してください`;
      }
      continue;
    }
    const v = answers[f.id];
    if (v == null || (typeof v === "string" && v.trim() === "")) {
      return `${f.label}を入力してください`;
    }
  }
  for (const q of config.customQuestions) {
    if (!q.label.trim() || !q.required) continue;
    const v = answers[q.id];
    if (v == null || (typeof v === "string" && v.trim() === "")) {
      return `${q.label}を入力してください`;
    }
  }
  return null;
}

export function applicationFormPath(recruitmentId: string): string {
  return `/recruitments/${recruitmentId}/application-form`;
}
