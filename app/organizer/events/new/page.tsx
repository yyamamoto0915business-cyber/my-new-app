"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventFormData } from "@/lib/events";
import { EVENT_TAGS } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";

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
};

function validateForm(data: EventFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) errors.title = "タイトルは必須です";
  if (!data.description.trim()) errors.description = "説明は必須です";
  if (!data.date) errors.date = "日付は必須です";
  if (!data.startTime) errors.startTime = "開始時刻は必須です";
  if (!data.location.trim()) errors.location = "場所は必須です";
  if (!data.address.trim()) errors.address = "住所は必須です";
  if (data.price < 0) errors.price = "料金は0以上で入力してください";
  if (!data.organizerName?.trim()) errors.organizerName = "主催者名は必須です";
  return errors;
}

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<EventFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [itemsInput, setItemsInput] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
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
        return;
      }
      router.push("/organizer/events");
    } catch {
      setSubmitError("通信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/organizer/events"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← イベント一覧へ
          </Link>
          <h1 className="mt-2 text-2xl font-bold">新規イベント作成</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              タイトル *
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium">
              イベント画像URL（任意）
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={form.imageUrl ?? ""}
              onChange={handleChange}
              placeholder="例: https://images.unsplash.com/photo-xxx?w=800"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Unsplash等の画像URLを貼り付けてください。未入力の場合はプレースホルダーが表示されます。
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <EventThumbnail
                imageUrl={form.imageUrl?.trim() || null}
                alt={form.title || "プレビュー"}
                rounded="lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              説明 *
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium">
                日付 *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium">
                開始時刻 *
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium">
              終了時刻
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              value={form.endTime || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium">
              場所 *
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="例: 中央公園"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              住所 *
            </label>
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="例: 東京都〇〇区〇〇町1-2-3"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          <div>
            <label htmlFor="prefecture" className="block text-sm font-medium">
              都道府県
            </label>
            <select
              id="prefecture"
              name="prefecture"
              value={form.prefecture ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {form.prefecture && (CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
            <div>
              <label htmlFor="city" className="block text-sm font-medium">
                市区町村
              </label>
              <select
                id="city"
                name="city"
                value={form.city ?? ""}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">選択してください</option>
                {CITIES_BY_PREF[form.prefecture]?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="area" className="block text-sm font-medium">
              エリア名（任意）
            </label>
            <input
              id="area"
              name="area"
              value={form.area ?? ""}
              onChange={handleChange}
              placeholder="例: 渋谷エリア"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">タグ（複数選択可）</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_TAGS.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={(form.tags ?? []).includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                  />
                  <span className="text-sm">{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="childFriendly"
              checked={form.childFriendly ?? false}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, childFriendly: e.target.checked }))
              }
            />
            <label htmlFor="childFriendly" className="text-sm">
              子連れOK
            </label>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium">
              定員（任意）
            </label>
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
              placeholder="例: 50"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="prioritySlots" className="block text-sm font-medium">
              優先枠数（任意）
            </label>
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
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="englishGuideAvailable"
              checked={form.englishGuideAvailable ?? false}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  englishGuideAvailable: e.target.checked,
                }))
              }
            />
            <label htmlFor="englishGuideAvailable" className="text-sm">
              英語対応
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium">
              スポンサーチケット（価格を選択）
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[300, 500, 1000, 3000, 5000].map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(form.sponsorTicketPrices ?? []).includes(p)}
                    onChange={(e) => {
                      const prev = form.sponsorTicketPrices ?? [];
                      if (e.target.checked) {
                        setForm((f) => ({
                          ...f,
                          sponsorTicketPrices: [...prev, p].sort((a, b) => a - b),
                        }));
                      } else {
                        setForm((f) => ({
                          ...f,
                          sponsorTicketPrices: prev.filter((x) => x !== p),
                        }));
                      }
                    }}
                  />
                  <span>¥{p.toLocaleString()}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium">
              料金（円）*
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="priceNote" className="block text-sm font-medium">
              料金補足
            </label>
            <input
              id="priceNote"
              name="priceNote"
              value={form.priceNote || ""}
              onChange={handleChange}
              placeholder="例: 材料費込み"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="organizerName" className="block text-sm font-medium">
              主催者名 *
            </label>
            <input
              id="organizerName"
              name="organizerName"
              value={form.organizerName ?? ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.organizerName && (
              <p className="mt-1 text-sm text-red-600">{errors.organizerName}</p>
            )}
          </div>

          <div>
            <label htmlFor="organizerContact" className="block text-sm font-medium">
              連絡先
            </label>
            <input
              id="organizerContact"
              name="organizerContact"
              value={form.organizerContact ?? ""}
              onChange={handleChange}
              placeholder="例: 03-1234-5678"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="rainPolicy" className="block text-sm font-medium">
              雨天時対応
            </label>
            <input
              id="rainPolicy"
              name="rainPolicy"
              value={form.rainPolicy || ""}
              onChange={handleChange}
              placeholder="例: 雨天決行"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="itemsToBring" className="block text-sm font-medium">
              持ち物（カンマ区切り）
            </label>
            <input
              id="itemsToBring"
              value={itemsInput}
              onChange={(e) => setItemsInput(e.target.value)}
              onBlur={handleItemsBlur}
              placeholder="例: レジャーシート、飲み物"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="access" className="block text-sm font-medium">
              アクセス
            </label>
            <input
              id="access"
              name="access"
              value={form.access || ""}
              onChange={handleChange}
              placeholder="例: 最寄り駅から徒歩10分"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "作成中..." : "作成する"}
            </button>
            <Link
              href="/organizer/events"
              className="rounded-lg border border-zinc-300 px-6 py-2 dark:border-zinc-700"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
