"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventFormData } from "@/lib/events";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormSection } from "@/components/organizer/events/EventFormSection";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";

type FormErrors = Partial<Record<keyof EventFormData, string>>;

const PREFECTURES = [
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

const CITIES_BY_PREF: Record<string, string[]> = {
  東京都: ["渋谷区", "新宿区", "港区", "中央区", "その他"],
  大阪府: ["大阪市", "その他"],
};

const initialForm: EventFormData = {
  title: "",
  imageUrl: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  address: "",
  price: 0,
  priceNote: "",
  organizerName: "地域振興会",
  organizerContact: "",
  rainPolicy: "",
  itemsToBring: [],
  access: "",
  childFriendly: false,
  prefecture: "",
  city: "",
  area: "",
  tags: [],
  sponsorTicketPrices: [],
  sponsorPerks: {},
  prioritySlots: 0,
  englishGuideAvailable: false,
  capacity: undefined,
  requiresRegistration: false,
  participationMode: "none",
  registrationDeadline: undefined,
  registrationNote: undefined,
};

function validateForm(data: EventFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = "イベント名を入力してください";
  if (!data.description.trim())
    errors.description = "イベント概要を入力してください";
  if (!data.date) errors.date = "開催日を選択してください";
  if (!data.startTime) errors.startTime = "開始時刻を入力してください";
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
  return errors;
}

const inputBase =
  "mt-2 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50";
const inputError = "border-red-300 focus:border-red-400 focus:ring-red-200/50";

function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1.5 text-xs text-amber-600">必須</span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const formTopRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<EventFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [itemsInput, setItemsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "price") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else if (name === "prefecture") {
      setForm((prev) => ({ ...prev, prefecture: value, city: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTagToggle = (tagId: string) => {
    setForm((prev) => {
      const tags = prev.tags ?? [];
      if (tags.includes(tagId)) {
        return { ...prev, tags: tags.filter((t) => t !== tagId) };
      }
      return { ...prev, tags: [...tags, tagId] };
    });
  };

  const handleItemsBlur = () => {
    if (itemsInput.trim()) {
      const items = itemsInput
        .split(/[,、\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      setForm((prev) => ({ ...prev, itemsToBring: items }));
      setItemsInput(items.join("、"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "作成に失敗しました");
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      router.push("/organizer/events");
    } catch {
      setSubmitError("通信に失敗しました");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  };

  const hasRequired =
    form.participationMode === "required" ||
    form.participationMode === "optional";

  return (
    <div className="space-y-6 pb-24 sm:pb-8" ref={formTopRef}>
      {/* ページヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/organizer/events"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← イベント一覧へ
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
            新しいイベントを作成
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            イベントの基本情報や開催情報を入力して作成できます。作成後は下書きとして保存され、一覧から公開できます。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/organizer/events"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            form="event-form"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "作成する"}
          </button>
        </div>
      </div>

      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <form
        id="event-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* A. 基本情報 */}
        <EventFormSection
          title="基本情報"
          description="イベントの名前や概要、見た目を設定します"
        >
          <FormField
            id="title"
            label="イベント名"
            required
            error={errors.title}
          >
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例：春の地域マルシェ"
              className={`${inputBase} ${errors.title ? inputError : ""}`}
            />
          </FormField>

          <FormField
            id="description"
            label="イベント概要"
            required
            error={errors.description}
            hint="参加者に伝えたい内容を入力してください"
          >
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="イベントの内容や魅力を簡潔に紹介してください"
              className={`${inputBase} resize-y min-h-[100px] ${errors.description ? inputError : ""}`}
            />
          </FormField>

          <FormField
            id="imageUrl"
            label="アイキャッチ画像"
            hint="画像URLを貼り付けるか、「ファイルから選ぶ」「写真を撮る」からアップロードできます。未入力の場合はプレースホルダーが表示されます。"
          >
            <EventImageInput
              url={form.imageUrl ?? ""}
              onChangeUrl={(url) =>
                setForm((prev) => ({
                  ...prev,
                  imageUrl: url,
                }))
              }
              alt={form.title || "プレビュー"}
            />
          </FormField>

          <div>
            <p className="text-sm font-medium text-slate-700">
              カテゴリー・特徴タグ
            </p>
            <p className="mt-1 text-xs text-slate-500">
              複数選択できます。該当するものを選んでください
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EVENT_TAGS.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:border-slate-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50/80"
                >
                  <input
                    type="checkbox"
                    checked={(form.tags ?? []).includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.childFriendly ?? false}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, childFriendly: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">子連れOK</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.englishGuideAvailable ?? false}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    englishGuideAvailable: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">英語対応あり</span>
            </label>
          </div>
        </EventFormSection>

        {/* B. 開催情報 */}
        <EventFormSection
          title="開催情報"
          description="日時と場所を入力してください"
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField id="date" label="開催日" required error={errors.date}>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className={`${inputBase} ${errors.date ? inputError : ""}`}
              />
            </FormField>
            <FormField
              id="startTime"
              label="開始時刻"
              required
              error={errors.startTime}
            >
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                className={`${inputBase} ${errors.startTime ? inputError : ""}`}
              />
            </FormField>
            <FormField
              id="endTime"
              label="終了時刻"
              error={errors.endTime}
              hint="任意。開始時刻より後にしてください"
            >
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={form.endTime || ""}
                onChange={handleChange}
                className={`${inputBase} ${errors.endTime ? inputError : ""}`}
              />
            </FormField>
          </div>

          <FormField
            id="location"
            label="開催場所"
            required
            error={errors.location}
            hint="会場名や施設名を入力"
          >
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="例：市民ホール 多目的室 / オンライン開催"
              className={`${inputBase} ${errors.location ? inputError : ""}`}
            />
          </FormField>

          <FormField
            id="address"
            label="住所"
            required
            error={errors.address}
          >
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="例：東京都渋谷区〇〇町1-2-3"
              className={`${inputBase} ${errors.address ? inputError : ""}`}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="prefecture" label="都道府県">
              <select
                id="prefecture"
                name="prefecture"
                value={form.prefecture ?? ""}
                onChange={handleChange}
                className={inputBase}
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
            {form.prefecture &&
              (CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
                <FormField id="city" label="市区町村">
                  <select
                    id="city"
                    name="city"
                    value={form.city ?? ""}
                    onChange={handleChange}
                    className={inputBase}
                  >
                    <option value="">選択してください</option>
                    {CITIES_BY_PREF[form.prefecture]?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
          </div>

          <FormField id="access" label="アクセス" hint="最寄り駅や目印など">
            <input
              id="access"
              name="access"
              value={form.access || ""}
              onChange={handleChange}
              placeholder="例：最寄り駅から徒歩10分"
              className={inputBase}
            />
          </FormField>

          <FormField id="rainPolicy" label="雨天時対応">
            <input
              id="rainPolicy"
              name="rainPolicy"
              value={form.rainPolicy || ""}
              onChange={handleChange}
              placeholder="例：雨天決行 / 小雨決行・荒天中止"
              className={inputBase}
            />
          </FormField>

          <FormField
            id="itemsToBring"
            label="持ち物"
            hint="カンマまたは改行で区切って入力"
          >
            <input
              id="itemsToBring"
              value={itemsInput}
              onChange={(e) => setItemsInput(e.target.value)}
              onBlur={handleItemsBlur}
              placeholder="例：レジャーシート、飲み物"
              className={inputBase}
            />
          </FormField>
        </EventFormSection>

        {/* C. 参加設定 */}
        <EventFormSection
          title="参加設定"
          description="参加登録が必要なイベントかどうかで設定が変わります"
        >
          <div>
            <p className="text-sm font-medium text-slate-700">
              参加登録 <span className="text-xs text-amber-600">設定</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              参加申込が必要なイベントのときだけ「参加登録あり」を選んでください
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50/50">
                <input
                  type="radio"
                  name="participationMode"
                  checked={(form.participationMode ?? "none") === "required"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      participationMode: "required",
                      requiresRegistration: true,
                    }))
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">
                    参加登録あり
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    申込必須。参加者は「申し込む」から応募します
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50/50">
                <input
                  type="radio"
                  name="participationMode"
                  checked={(form.participationMode ?? "none") === "optional"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      participationMode: "optional",
                      requiresRegistration: false,
                    }))
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">
                    参加登録任意
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    「参加予定にする」で関心を表明。申込も可能
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50/50">
                <input
                  type="radio"
                  name="participationMode"
                  checked={(form.participationMode ?? "none") === "none"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      participationMode: "none",
                      requiresRegistration: false,
                    }))
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">
                    参加登録なし
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    自由参加。参加予定・気になるボタンのみ
                  </p>
                </div>
              </label>
            </div>
          </div>

          {(form.participationMode ?? "none") === "required" && (
            <div className="space-y-5 border-t border-slate-100 pt-5">
              <FormField id="capacity" label="定員" hint="任意">
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={0}
                  value={form.capacity ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      capacity: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="例：50"
                  className={inputBase}
                />
              </FormField>
              <FormField
                id="registrationDeadline"
                label="申込締切"
                hint="任意。締切日時を指定"
              >
                <input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="datetime-local"
                  value={
                    form.registrationDeadline
                      ? (() => {
                          const d = new Date(form.registrationDeadline);
                          const pad = (n: number) =>
                            String(n).padStart(2, "0");
                          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()
                      : ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      registrationDeadline: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    }))
                  }
                  className={inputBase}
                />
              </FormField>
              <FormField
                id="registrationNote"
                label="申込メモ・注意事項"
                hint="例：定員に達し次第締め切ります"
              >
                <textarea
                  id="registrationNote"
                  name="registrationNote"
                  rows={2}
                  value={form.registrationNote ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      registrationNote: e.target.value || undefined,
                    }))
                  }
                  placeholder="参加者への連絡事項や注意書き"
                  className={`${inputBase} resize-y min-h-[60px]`}
                />
              </FormField>
            </div>
          )}

          <FormField
            id="price"
            label="参加費（円）"
            required
            error={errors.price}
            hint="0で無料イベント"
          >
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              className={`${inputBase} ${errors.price ? inputError : ""}`}
            />
          </FormField>

          <FormField id="priceNote" label="料金補足">
            <input
              id="priceNote"
              name="priceNote"
              value={form.priceNote || ""}
              onChange={handleChange}
              placeholder="例：材料費込み"
              className={inputBase}
            />
          </FormField>

          {hasRequired && (
            <FormField id="prioritySlots" label="優先枠数" hint="任意">
              <input
                id="prioritySlots"
                name="prioritySlots"
                type="number"
                min={0}
                value={form.prioritySlots ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    prioritySlots: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className={inputBase}
              />
            </FormField>
          )}
        </EventFormSection>

        {/* D. 主催者・補足 */}
        <EventFormSection
          title="主催者情報"
          description="イベントの主催者として表示される情報です"
        >
          <FormField
            id="organizerName"
            label="主催者名"
            required
            error={errors.organizerName}
          >
            <input
              id="organizerName"
              name="organizerName"
              value={form.organizerName ?? ""}
              onChange={handleChange}
              placeholder="例：〇〇実行委員会"
              className={`${inputBase} ${errors.organizerName ? inputError : ""}`}
            />
          </FormField>

          <FormField id="organizerContact" label="連絡先" hint="電話番号やメールアドレス">
            <input
              id="organizerContact"
              name="organizerContact"
              value={form.organizerContact ?? ""}
              onChange={handleChange}
              placeholder="例：03-1234-5678"
              className={inputBase}
            />
          </FormField>

          <FormField id="area" label="エリア名">
            <input
              id="area"
              name="area"
              value={form.area ?? ""}
              onChange={handleChange}
              placeholder="例：渋谷エリア"
              className={inputBase}
            />
          </FormField>
        </EventFormSection>

        {/* 保存エリア */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">
            作成後は下書きとして保存されます。イベント一覧から確認し、公開できます。
          </p>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <p className="text-xs leading-relaxed text-slate-500">
              公開にあたり、掲載内容の責任は主催者が負うものとします。
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-slate-300"
              />
              <span className="text-[13px] leading-relaxed text-slate-700">
                掲載内容の責任を理解し、
                <Link href="/terms" target="_blank" className="font-medium text-slate-800 underline underline-offset-2 hover:text-[var(--mg-accent)]">利用規約</Link>
                に同意する
              </span>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={submitting || !agreedToTerms}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "作成中..." : "作成する"}
            </button>
            <Link
              href="/organizer/events"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
