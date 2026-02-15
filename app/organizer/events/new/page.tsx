"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventFormData } from "@/lib/events";

type FormErrors = Partial<Record<keyof EventFormData, string>>;

const initialForm: EventFormData = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  address: "",
  price: 0,
  priceNote: "",
  organizerName: "",
  organizerContact: "",
  rainPolicy: "",
  itemsToBring: [],
  access: "",
  childFriendly: false,
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
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    // Mock: 実際にはAPIに送信。ここでは一覧にリダイレクト
    router.push("/organizer/events");
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

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              作成する
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
