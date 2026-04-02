"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormSection } from "@/components/organizer/events/EventFormSection";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { getJstNowHm, getJstTodayYmd, toJstTimestamp } from "@/lib/jst-date";

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
      setItemsInput(Array.isArray(data.itemsToBring) ? data.itemsToBring.join("、") : "");
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
      setForm((prev) => (prev ? { ...prev, [name]: parseInt(value, 10) || 0 } : prev));
    } else if (name === "prefecture") {
      setForm((prev) => (prev ? { ...prev, prefecture: value, city: "" } : prev));
    } else {
      setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (!form) return;
    setForm((prev) => {
      if (!prev) return prev;
      const tags = prev.tags ?? [];
      if (tags.includes(tagId)) {
        return { ...prev, tags: tags.filter((t) => t !== tagId) };
      }
      return { ...prev, tags: [...tags, tagId] };
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="space-y-6 pb-24">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  const todayJst = getJstTodayYmd();
  const nowJstHm = getJstNowHm();
  const startTimeMin = form.date === todayJst ? nowJstHm : undefined;

  const hasRequired =
    form.participationMode === "required" ||
    form.participationMode === "optional";
  const statusLabel =
    STATUS_LABELS[event?.status ?? ""] ?? (event?.status || "下書き");

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
            イベントを編集
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            イベント内容や公開設定を更新できます
          </p>
          {event?.title && (
            <p className="mt-1 text-sm font-medium text-slate-700">
              {event.title}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/organizer/events"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            一覧へ戻る
          </Link>
          <button
            type="submit"
            form="event-edit-form"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          保存しました
        </div>
      )}

      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <form
        id="event-edit-form"
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
                setForm((prev) => (prev ? { ...prev, imageUrl: url } : prev))
              }
              alt={form.title || "プレビュー"}
            />
          </FormField>

          <div>
            <p className="text-sm font-medium text-slate-700">
              カテゴリー・特徴タグ
            </p>
            <p className="mt-1 text-xs text-slate-500">
              複数選択できます
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
                  setForm((prev) =>
                    prev ? { ...prev, childFriendly: e.target.checked } : prev
                  )
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
                  setForm((prev) =>
                    prev
                      ? { ...prev, englishGuideAvailable: e.target.checked }
                      : prev
                  )
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
                min={todayJst}
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
                min={startTimeMin}
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
              {[
                {
                  mode: "required" as const,
                  label: "参加登録あり",
                  desc: "申込必須。参加者は「申し込む」から応募します",
                },
                {
                  mode: "optional" as const,
                  label: "参加登録任意",
                  desc: "「参加予定にする」で関心を表明。申込も可能",
                },
                {
                  mode: "none" as const,
                  label: "参加登録なし",
                  desc: "自由参加。参加予定・気になるボタンのみ",
                },
              ].map(({ mode, label, desc }) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50/50"
                >
                  <input
                    type="radio"
                    name="participationMode"
                    checked={(form.participationMode ?? "none") === mode}
                    onChange={() =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              participationMode: mode,
                              requiresRegistration: mode === "required",
                            }
                          : prev
                      )
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">
                      {label}
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                  </div>
                </label>
              ))}
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
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            capacity: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }
                        : prev
                    )
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
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            registrationDeadline: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          }
                        : prev
                    )
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
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            registrationNote:
                              e.target.value || undefined,
                          }
                        : prev
                    )
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
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          prioritySlots: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        }
                      : prev
                  )
                }
                className={inputBase}
              />
            </FormField>
          )}
        </EventFormSection>

        {/* D. 公開設定（表示のみ・変更は一覧から） */}
        <EventFormSection
          title="公開設定"
          description="現在の公開状態です。公開・非公開の切り替えはイベント一覧から行えます"
        >
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              現在の状態：{" "}
              <span
                className={
                  event?.status === "published"
                    ? "text-emerald-700"
                    : "text-slate-600"
                }
              >
                {statusLabel}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              イベント一覧から「公開する」「公開/非公開切替」で変更できます
            </p>
          </div>
        </EventFormSection>

        {/* E. 補助情報 */}
        {event && (
          <EventFormSection
            title="補助情報"
            description="イベントの管理情報"
          >
            <div className="space-y-2 text-sm text-slate-600">
              {event.createdAt && (
                <p>作成日：{formatDate(event.createdAt)}</p>
              )}
              <p className="text-xs text-slate-500">ID: {event.id}</p>
            </div>
          </EventFormSection>
        )}

        {/* 保存エリア */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">
            変更後は「変更を保存」を押すと反映されます
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "保存中..." : "変更を保存"}
            </button>
            <Link
              href="/organizer/events"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </Link>
            <Link
              href={`/events/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              詳細をプレビュー
            </Link>
          </div>
        </div>
      </form>

      {/* 危険操作 */}
      <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-800">
          危険な操作
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          イベントを削除すると元に戻せません。募集や参加情報も削除されます。
        </p>
        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            削除する
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "削除中..." : "本当に削除する"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
