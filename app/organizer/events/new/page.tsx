"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Event, EventFormData } from "@/lib/events";
import { eventToForm } from "@/lib/organizer-event-to-form";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventFormSection } from "@/components/organizer/events/EventFormSection";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { EventFormActions } from "@/components/organizer/events/EventFormActions";
import { buildPlanSummary, type PlanSummary } from "@/lib/organizer-plan-summary";
import { OrganizerPlanInlineHint } from "@/components/organizer/OrganizerPlanInlineHint";
import { OrganizerFreePlanBanner } from "@/components/organizer/OrganizerFreePlanBanner";

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

function NewEventPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
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
  const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(
    null
  );
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (!copyFromId) return;
    let cancelled = false;
    (async () => {
      setCopyLoading(true);
      setSubmitError(null);
      try {
        const res = await fetch(`/api/organizer/events/${copyFromId}`);
        const data = (await res.json()) as Event | { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setSubmitError(
            typeof (data as { error?: string }).error === "string"
              ? (data as { error: string }).error
              : "複製元のイベントを読み込めませんでした"
          );
          return;
        }
        if (!data || typeof (data as Event).title !== "string") {
          setSubmitError("複製元のイベントを読み込めませんでした");
          return;
        }
        const ev = data as Event;
        setForm(eventToForm(ev));
        setItemsInput((ev.itemsToBring ?? []).join("、"));
        setErrors({});
      } catch {
        if (!cancelled) setSubmitError("複製元のイベントを読み込めませんでした");
      } finally {
        if (!cancelled) setCopyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copyFromId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing");
        const d = await res.json();
        if (!res.ok || cancelled) return;
        setPlanSummary(
          buildPlanSummary(
            {
              subscription_status: d.organizer?.subscription_status ?? null,
              founder30_end_at: d.organizer?.founder30_end_at ?? null,
            },
            typeof d.monthlyPublished === "number" ? d.monthlyPublished : 0
          )
        );
      } catch {
        if (!cancelled) setPlanSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const saveDraft = async () => {
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting("draft");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const base =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "作成に失敗しました";
        const devHint =
          process.env.NODE_ENV === "development" && typeof data.debug === "string"
            ? `（詳細: ${data.debug}）`
            : "";
        setSubmitError(`${base}${devHint}`);
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      showToast("success", "下書きを保存しました");
      router.refresh();
      setTimeout(() => router.push("/organizer/events"), 350);
    } catch {
      setSubmitError("通信に失敗しました");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(null);
    }
  };

  const publishEvent = async () => {
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitError("入力内容をご確認ください");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting("publish");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const base =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "作成に失敗しました";
        const devHint =
          process.env.NODE_ENV === "development" && typeof data.debug === "string"
            ? `（詳細: ${data.debug}）`
            : "";
        setSubmitError(`${base}${devHint}`);
        formTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      const eventId = typeof data.id === "string" ? data.id : null;
      if (!eventId) {
        setSubmitError("イベントIDを取得できませんでした");
        return;
      }

      const pubRes = await fetch(`/api/events/${eventId}/publish`, { method: "POST" });
      const pubJson = await pubRes.json().catch(() => ({}));
      if (!pubRes.ok) {
        if (pubRes.status === 402) {
          showToast(
            "error",
            typeof pubJson?.error === "string" ? pubJson.error : "公開枠がありません"
          );
          return;
        }
        setSubmitError(
          typeof pubJson?.error === "string" ? pubJson.error : "公開に失敗しました"
        );
        return;
      }

      showToast("success", "イベントを公開しました");
      router.refresh();
      setTimeout(() => router.push("/organizer/events"), 350);
    } catch {
      setSubmitError("通信に失敗しました");
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveDraft();
  };

  const publishLimit = planSummary?.publishLimit ?? null;
  const hasPublishSlot =
    publishLimit === null ? true : (planSummary?.monthlyPublished ?? 0) < publishLimit;
  const publishDisabledReason: null | "required_missing" | "no_slots" = (() => {
    if (!hasPublishSlot) return "no_slots";
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) return "required_missing";
    return null;
  })();

  return (
    <div className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-6 pb-24 sm:pb-8" ref={formTopRef}>
      {copyLoading && (
        <p className="text-sm text-slate-500" role="status">
          複製元の内容を読み込み中…
        </p>
      )}
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
          1. 基本情報
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">
          2. 開催情報
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">
          3. 詳細情報（任意）
        </span>
      </div>
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
            必須項目だけ入力して、下書きを保存していきましょう。あとで編集・公開できます。
          </p>
        </div>
        <EventFormActions
          submitting={submitting}
          canSubmit={agreedToTerms}
          publishDisabledReason={publishDisabledReason}
          onClickPublish={() => {
            if (submitting) return;
            if (!agreedToTerms) {
              showToast("error", "利用規約への同意が必要です");
              return;
            }
            if (publishDisabledReason === "no_slots") {
              showToast("error", "公開枠がありません");
              return;
            }
            if (publishDisabledReason === "required_missing") {
              const formErrors = validateForm(form);
              setErrors(formErrors);
              setSubmitError("必須項目をご確認ください");
              formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            setShowPublishConfirm(true);
          }}
          compact
        />
      </div>

      <div className="space-y-3">
        {planSummary?.isFreePlan && (
          <OrganizerFreePlanBanner planSummary={planSummary} variant="soft" />
        )}
        <OrganizerPlanInlineHint planSummary={planSummary} />
      </div>

      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {!hasPublishSlot && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 sm:px-5">
          <p>今月の公開枠を使い切りました。プランを変更すると公開枠を増やせます。</p>
          <Link
            href="/organizer/settings/plan"
            className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            プラン変更
          </Link>
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
          description="まずはイベント名と概要を整えます。画像や補足はあとで編集できます。"
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
            hint="アップロードが主操作です。URL指定は必要なときだけ使えます。"
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

          <FormField
            id="organizerName"
            label="主催者名"
            required
            error={errors.organizerName}
            hint="イベントの主催者として表示されます"
          >
            <input
              id="organizerName"
              name="organizerName"
              value={form.organizerName ?? ""}
              onChange={handleChange}
              placeholder="例：地域振興会 / 〇〇実行委員会"
              className={`${inputBase} ${errors.organizerName ? inputError : ""}`}
            />
          </FormField>

          <FormField
            id="organizerContact"
            label="連絡先（任意）"
            hint="電話番号やメールアドレスなど"
          >
            <input
              id="organizerContact"
              name="organizerContact"
              value={form.organizerContact ?? ""}
              onChange={handleChange}
              placeholder="例：03-1234-5678 / mail@example.com"
              className={inputBase}
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
          description="日時と場所を入力します。ここまでで下書き保存できます。"
        >
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-800">開催日時</p>
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
              label="終了時刻（任意）"
              error={errors.endTime}
              hint="未入力でも保存できます。入力する場合は開始時刻より後にしてください"
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

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="prefecture" label="都道府県" required>
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
          </div>

          {form.prefecture &&
            (CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
              <FormField id="city" label="市区町村（任意）">
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

          <FormField id="access" label="アクセス（任意）" hint="目印や最寄り駅など">
            <input
              id="access"
              name="access"
              value={form.access || ""}
              onChange={handleChange}
              placeholder="例：最寄り駅から徒歩10分"
              className={inputBase}
            />
          </FormField>

          <FormField
            id="price"
            label="参加費（円）"
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

          <FormField
            id="rainPolicy"
            label="雨天時対応（任意）"
            hint="開催方針を短く"
          >
            <input
              id="rainPolicy"
              name="rainPolicy"
              value={form.rainPolicy || ""}
              onChange={handleChange}
              placeholder="例：雨天決行 / 小雨決行・荒天中止"
              className={inputBase}
            />
          </FormField>
        </EventFormSection>

        <EventFormSection
          title="詳細情報（任意）"
          description="必要なときだけ入力してください。あとから編集できます。"
        >
          <details className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4" open={false}>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              詳細情報を設定する
            </summary>
            <div className="mt-4 space-y-5">
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

              <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-4">
                <p className="text-sm font-medium text-slate-700">参加設定（任意）</p>
                <p className="text-xs text-slate-500">
                  必要なイベントのみ設定してください。未設定でも下書き保存できます。
                </p>
                <div className="space-y-3">
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
                      <span className="text-sm font-medium text-slate-800">参加登録あり</span>
                      <p className="mt-0.5 text-xs text-slate-500">申込必須で受け付けます</p>
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
                      <span className="text-sm font-medium text-slate-800">参加登録任意</span>
                      <p className="mt-0.5 text-xs text-slate-500">参加予定として関心表明できます</p>
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
                      <span className="text-sm font-medium text-slate-800">参加登録なし</span>
                      <p className="mt-0.5 text-xs text-slate-500">自由参加で開催します</p>
                    </div>
                  </label>
                </div>
                {(form.participationMode ?? "none") === "required" && (
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <FormField id="capacity" label="定員（任意）">
                      <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min={0}
                        value={form.capacity ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            capacity: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        placeholder="例：50"
                        className={inputBase}
                      />
                    </FormField>
                    <FormField id="registrationDeadline" label="申込締切（任意）">
                      <input
                        id="registrationDeadline"
                        name="registrationDeadline"
                        type="datetime-local"
                        value={
                          form.registrationDeadline
                            ? (() => {
                                const d = new Date(form.registrationDeadline);
                                const pad = (n: number) => String(n).padStart(2, "0");
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
                      label="申込メモ・注意事項（任意）"
                      hint="参加者に伝えたいことがあれば"
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
                        placeholder="例：定員に達し次第締め切ります"
                        className={`${inputBase} resize-y min-h-[60px]`}
                      />
                    </FormField>
                  </div>
                )}
              </div>
            </div>
          </details>
        </EventFormSection>

        {/* 保存エリア */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">
            保存は下書きとして行われます。あとで編集・公開できます。
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

          <EventFormActions
            submitting={submitting}
            canSubmit={agreedToTerms}
            publishDisabledReason={publishDisabledReason}
            onClickPublish={() => {
              if (submitting) return;
              if (!agreedToTerms) {
                showToast("error", "利用規約への同意が必要です");
                return;
              }
              if (publishDisabledReason === "no_slots") {
                showToast("error", "公開枠がありません");
                return;
              }
              if (publishDisabledReason === "required_missing") {
                const formErrors = validateForm(form);
                setErrors(formErrors);
                setSubmitError("必須項目をご確認ください");
                formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
              setShowPublishConfirm(true);
            }}
          />
          <p className="mt-3 text-xs text-slate-500">下書きとして保存され、あとで編集・公開できます。</p>
        </div>
      </form>
      {showPublishConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowPublishConfirm(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl">
            <p className="font-medium text-slate-900">この内容で公開しますか？</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              公開後も編集できます。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishConfirm(false);
                  publishEvent();
                }}
                disabled={submitting !== null}
                className="rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting === "publish" ? "公開中..." : "公開する"}
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<NewEventPageSkeleton />}>
      <NewEventPageContent />
    </Suspense>
  );
}
