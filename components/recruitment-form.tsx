"use client";

import { useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export type RecruitmentFormValues = {
  title: string;
  description: string;
  status: "draft" | "public";
  start_at: string;
  end_at: string;
  meeting_place: string;
  meeting_lat: number | null;
  meeting_lng: number | null;
  roles: { name: string; count: number }[];
  capacity: number | null;
  items_to_bring: string;
  provisions: string;
  notes: string;
};

const DEFAULT_VALUES: RecruitmentFormValues = {
  title: "",
  description: "",
  status: "draft",
  start_at: "",
  end_at: "",
  meeting_place: "",
  meeting_lat: null,
  meeting_lng: null,
  roles: [{ name: "受付", count: 1 }],
  capacity: null,
  items_to_bring: "",
  provisions: "",
  notes: "",
};

type Props = {
  initialValues?: Partial<RecruitmentFormValues>;
  recruitmentId?: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function RecruitmentForm({
  initialValues,
  recruitmentId,
  onSuccess,
  onCancel,
}: Props) {
  const [form, setForm] = useState<RecruitmentFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof RecruitmentFormValues>(
    key: K,
    value: RecruitmentFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const addRole = () => {
    setForm((prev) => ({
      ...prev,
      roles: [...prev.roles, { name: "", count: 1 }],
    }));
  };

  const removeRole = (i: number) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, idx) => idx !== i),
    }));
  };

  const updateRole = (i: number, field: "name" | "count", value: string | number) => {
    setForm((prev) => {
      const roles = [...prev.roles];
      roles[i] = { ...roles[i], [field]: value };
      return { ...prev, roles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        meeting_place: form.meeting_place.trim() || null,
        meeting_lat: form.meeting_lat,
        meeting_lng: form.meeting_lng,
        roles: form.roles.filter((r) => r.name.trim()),
        capacity: form.capacity,
        items_to_bring: form.items_to_bring.trim() || null,
        provisions: form.provisions.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (recruitmentId) {
        const res = await fetchWithTimeout(`/api/recruitments/${recruitmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "更新に失敗しました");
        }
        onSuccess(recruitmentId);
      } else {
        const res = await fetchWithTimeout("/api/recruitments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "作成に失敗しました");
        }
        const data = await res.json();
        onSuccess(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="例：フリマ受付スタッフ募集"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          説明 <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="募集内容の詳細"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            開始日時
          </label>
          <input
            type="datetime-local"
            value={form.start_at}
            onChange={(e) => update("start_at", e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            終了日時
          </label>
          <input
            type="datetime-local"
            value={form.end_at}
            onChange={(e) => update("end_at", e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          集合場所
        </label>
        <input
          type="text"
          value={form.meeting_place}
          onChange={(e) => update("meeting_place", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="例：〇〇公民館 正面玄関"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          役割と必要人数
        </label>
        <div className="mt-2 space-y-2">
          {form.roles.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateRole(i, "name", e.target.value)}
                className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="役割名"
              />
              <input
                type="number"
                min={1}
                value={r.count}
                onChange={(e) => updateRole(i, "count", parseInt(e.target.value, 10) || 1)}
                className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={() => removeRole(i)}
                className="text-red-600 hover:text-red-700"
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRole}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            + 役割を追加
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          募集人数（定員）
        </label>
        <input
          type="number"
          min={1}
          value={form.capacity ?? ""}
          onChange={(e) => update("capacity", e.target.value ? parseInt(e.target.value, 10) : null)}
          className="mt-1 w-32 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="任意"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          持ち物・服装
        </label>
        <textarea
          rows={2}
          value={form.items_to_bring}
          onChange={(e) => update("items_to_bring", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="例：動きやすい服、飲み物"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          支給（交通費・食事など）
        </label>
        <input
          type="text"
          value={form.provisions}
          onChange={(e) => update("provisions", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="任意"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          注意事項
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          公開状態
        </label>
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value as "draft" | "public")}
          className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="draft">下書き</option>
          <option value="public">公開</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "保存中..." : recruitmentId ? "更新" : "作成"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
