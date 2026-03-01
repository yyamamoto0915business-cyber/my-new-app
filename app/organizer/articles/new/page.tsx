"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type {
  ArticleBlock,
  ArticleTemplateType,
  ReadArticle,
} from "@/lib/read-article-types";
import {
  ARTICLE_TEMPLATE_LABELS,
  TEMPLATE_HEADINGS,
} from "@/lib/read-article-types";
import { ArticleBlockRenderer } from "@/components/read/article-block-renderer";
import { EventCard } from "@/app/events/event-card";
import { getEvents, getEventById } from "@/lib/events";

const MOCK_ORGANIZER_ID = "org-1";
const MOCK_ORGANIZER_NAME = "地域振興会";

const STEPS = [
  "テンプレート",
  "基本情報",
  "本文セクション",
  "当日の流れ（任意）",
  "よくある質問（任意）",
  "関連イベント",
  "プレビュー",
] as const;

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200";

function buildBlocks(
  templateType: ArticleTemplateType,
  sections: { heading: string; body: string }[],
  timelineItems: { time: string; text: string }[],
  qaItems: { q: string; a: string }[],
  eventIds: string[]
): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];

  sections.forEach((s) => {
    if (s.heading.trim()) blocks.push({ type: "heading", text: s.heading });
    if (s.body.trim()) blocks.push({ type: "paragraph", text: s.body });
  });

  if (timelineItems.some((t) => t.time.trim() || t.text.trim())) {
    blocks.push({
      type: "timeline",
      items: timelineItems.filter((t) => t.time.trim() || t.text.trim()),
    });
  }

  if (qaItems.some((q) => q.q.trim() || q.a.trim())) {
    blocks.push({
      type: "qa",
      items: qaItems.filter((q) => q.q.trim() || q.a.trim()),
    });
  }

  if (eventIds.length > 0) {
    blocks.push({ type: "eventEmbed", eventIds });
  }

  return blocks;
}

function NewArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(0);
  const [templateType, setTemplateType] = useState<ArticleTemplateType>("feature");
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(DEFAULT_COVER);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [sections, setSections] = useState<{ heading: string; body: string }[]>([]);
  const [timelineItems, setTimelineItems] = useState<{ time: string; text: string }[]>([
    { time: "", text: "" },
  ]);
  const [qaItems, setQaItems] = useState<{ q: string; a: string }[]>([
    { q: "", a: "" },
  ]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headings = TEMPLATE_HEADINGS[templateType];

  // テンプレ変更時にセクションをリセット（編集モードでは上書きしない）
  useEffect(() => {
    if (editId) return;
    setSections(
      headings.map((h) => ({
        heading: h,
        body: "",
      }))
    );
  }, [templateType, editId]);

  // 編集時は既存記事を取得
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/read-articles/${editId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((article: ReadArticle | null) => {
        if (!article) return;
        setTemplateType(article.templateType);
        setTitle(article.title);
        setLead(article.lead);
        setCoverImageUrl(article.coverImageUrl);
        setTags(article.tags ?? []);

        const secs: { heading: string; body: string }[] = [];
        let ti: { time: string; text: string }[] = [];
        let qa: { q: string; a: string }[] = [];
        let evIds: string[] = [];

        for (const b of article.blocks) {
          if (b.type === "heading") secs.push({ heading: b.text, body: "" });
          else if (b.type === "paragraph" && secs.length > 0)
            secs[secs.length - 1].body = b.text;
          else if (b.type === "timeline") ti = b.items?.length ? b.items : [{ time: "", text: "" }];
          else if (b.type === "qa") qa = b.items?.length ? b.items : [{ q: "", a: "" }];
          else if (b.type === "eventEmbed") evIds = b.eventIds ?? [];
        }
        if (secs.length > 0) setSections(secs);
        if (ti.length > 0) setTimelineItems(ti);
        if (qa.length > 0) setQaItems(qa);
        setEventIds(evIds);
      })
      .catch(() => setError("記事の読み込みに失敗しました"));
  }, [editId]);

  const blocks = buildBlocks(
    templateType,
    sections,
    timelineItems,
    qaItems,
    eventIds
  );

  const canNext =
    (step === 0 && templateType) ||
    (step === 1 && title.trim() && lead.trim() && coverImageUrl.trim()) ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5 ||
    step === 6;

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback(
    (i: number) => setTags(tags.filter((_, j) => j !== i)),
    [tags]
  );

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setError("");
    const payload = {
      title: title.trim(),
      lead: lead.trim().slice(0, 140),
      coverImageUrl: coverImageUrl.trim() || DEFAULT_COVER,
      tags,
      templateType,
      authorId: MOCK_ORGANIZER_ID,
      authorName: MOCK_ORGANIZER_NAME,
      blocks,
      status: "draft",
    };

    try {
      if (editId) {
        const res = await fetch(`/api/read-articles/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        router.push("/organizer/articles");
        return;
      }
      const res = await fetch("/api/read-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/organizer/articles");
    } catch (e) {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [
    editId,
    title,
    lead,
    coverImageUrl,
    tags,
    templateType,
    blocks,
    router,
  ]);

  const publish = useCallback(async () => {
    setSaving(true);
    setError("");
    const payload = {
      title: title.trim(),
      lead: lead.trim().slice(0, 140),
      coverImageUrl: coverImageUrl.trim() || DEFAULT_COVER,
      tags,
      templateType,
      authorId: MOCK_ORGANIZER_ID,
      authorName: MOCK_ORGANIZER_NAME,
      blocks,
      status: "published",
    };

    try {
      if (editId) {
        const res = await fetch(`/api/read-articles/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "published" }),
        });
        if (!res.ok) throw new Error(await res.text());
        router.push("/organizer/articles");
        return;
      }
      const res = await fetch("/api/read-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/organizer/articles");
    } catch (e) {
      setError("公開に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [
    editId,
    title,
    lead,
    coverImageUrl,
    tags,
    templateType,
    blocks,
    router,
  ]);

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const allEvents = getEvents();
  const maxEventEmbed = 6;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Link
            href="/organizer/articles"
            className="text-sm text-[var(--foreground-muted)] hover:underline"
          >
            ← 記事管理
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {editId ? "記事を編集" : "新規記事"}
            </h1>
            <span className="text-xs text-[var(--foreground-muted)]">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded px-2 py-0.5 text-xs ${
                  i === step
                    ? "bg-[var(--accent)] text-white"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {s.replace("（任意）", "")}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Step 0: テンプレート */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              記事の種類を選ぶと、入力する見出しが決まります。
            </p>
            {(Object.keys(ARTICLE_TEMPLATE_LABELS) as ArticleTemplateType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplateType(t)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    templateType === t
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-white hover:border-zinc-300 dark:bg-[var(--background)]"
                  }`}
                >
                  <span className="font-medium">{ARTICLE_TEMPLATE_LABELS[t]}</span>
                </button>
              )
            )}
          </div>
        )}

        {/* Step 1: 基本情報 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：秋のイベントまつり特集"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                カバー画像 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex flex-wrap gap-4">
                <div className="relative h-28 w-40 overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-100">
                  <Image
                    src={coverImageUrl || DEFAULT_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={coverImageUrl.startsWith("data:")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="url"
                    value={coverImageUrl === DEFAULT_COVER ? "" : coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value || DEFAULT_COVER)}
                    placeholder="画像URLを入力"
                    className="w-64 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                  />
                  <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-center text-sm dark:bg-zinc-900">
                    ファイルを選択
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverFile}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                リード（140字以内） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lead}
                onChange={(e) => setLead(e.target.value.slice(0, 140))}
                placeholder="例：地域の秋を楽しむイベントを一挙紹介。週末の予定にぴったりの企画を厳選しました。"
                maxLength={140}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900"
              />
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                {lead.length} / 140 文字
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                タグ <span className="text-[var(--foreground-muted)]">（任意）</span>
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-sm dark:bg-zinc-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="text-zinc-500 hover:text-zinc-700"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  onBlur={addTag}
                  placeholder="例：特集"
                  className="w-24 rounded border border-[var(--border)] bg-white px-2 py-0.5 text-sm dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: セクション */}
        {step === 2 && (
          <div className="space-y-8">
            <p className="text-sm text-[var(--foreground-muted)]">
              見出しに沿って本文を入力してください。
            </p>
            {sections.map((sec, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
                <input
                  type="text"
                  value={sec.heading}
                  onChange={(e) => {
                    const next = [...sections];
                    next[i] = { ...next[i], heading: e.target.value };
                    setSections(next);
                  }}
                  placeholder="見出し"
                  className="mb-3 w-full rounded border border-[var(--border)] bg-white px-3 py-2 font-serif text-lg dark:bg-zinc-900"
                />
                <textarea
                  value={sec.body}
                  onChange={(e) => {
                    const next = [...sections];
                    next[i] = { ...next[i], body: e.target.value };
                    setSections(next);
                  }}
                  placeholder="例：この特集では、地域の秋イベントを紹介します。"
                  rows={4}
                  className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm leading-relaxed dark:bg-zinc-900"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: 当日の流れ（任意） */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              任意です。当日のタイムラインがある場合は入力してください。
            </p>
            {timelineItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item.time}
                  onChange={(e) => {
                    const next = [...timelineItems];
                    next[i] = { ...next[i], time: e.target.value };
                    setTimelineItems(next);
                  }}
                  placeholder="10:00"
                  className="w-20 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const next = [...timelineItems];
                    next[i] = { ...next[i], text: e.target.value };
                    setTimelineItems(next);
                  }}
                  placeholder="受付開始"
                  className="flex-1 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTimelineItems(timelineItems.filter((_, j) => j !== i))
                  }
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setTimelineItems([...timelineItems, { time: "", text: "" }])
              }
              className="rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
            >
              ＋ 行を追加
            </button>
          </div>
        )}

        {/* Step 4: Q&A（任意） */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              任意です。よくある質問を追加できます。
            </p>
            {qaItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
                <input
                  type="text"
                  value={item.q}
                  onChange={(e) => {
                    const next = [...qaItems];
                    next[i] = { ...next[i], q: e.target.value };
                    setQaItems(next);
                  }}
                  placeholder="Q. 雨天の場合は？"
                  className="mb-2 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                />
                <input
                  type="text"
                  value={item.a}
                  onChange={(e) => {
                    const next = [...qaItems];
                    next[i] = { ...next[i], a: e.target.value };
                    setQaItems(next);
                  }}
                  placeholder="A. 小雨決行です。"
                  className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setQaItems(qaItems.filter((_, j) => j !== i))}
                  className="mt-2 text-sm text-zinc-500 hover:underline"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQaItems([...qaItems, { q: "", a: "" }])}
              className="rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900"
            >
              ＋ Q&Aを追加
            </button>
          </div>
        )}

        {/* Step 5: 関連イベント */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              記事内に埋め込むイベントを選んでください（最大{maxEventEmbed}件）。
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {allEvents.slice(0, 12).map((ev) => {
                const checked = eventIds.includes(ev.id);
                const disabled =
                  !checked && eventIds.length >= maxEventEmbed;
                return (
                  <label
                    key={ev.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                      disabled ? "cursor-not-allowed opacity-60" : ""
                    } ${checked ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.checked)
                          setEventIds([...eventIds, ev.id].slice(0, maxEventEmbed));
                        else setEventIds(eventIds.filter((id) => id !== ev.id));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium line-clamp-1">
                      {ev.title}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: プレビュー */}
        {step === 6 && (
          <div className="space-y-8">
            <p className="text-sm text-[var(--foreground-muted)]">
              ［PC表示イメージ］公開前に確認してください。
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-zinc-100">
                <Image
                  src={coverImageUrl || DEFAULT_COVER}
                  alt=""
                  width={672}
                  height={336}
                  className="h-full w-full object-cover"
                  unoptimized={coverImageUrl.startsWith("data:")}
                />
              </div>
              <h1 className="mt-6 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {title || "（タイトル）"}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">
                {lead || "（リード）"}
              </p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-8">
                <ArticleBlockRenderer blocks={blocks} />
              </div>
              {eventIds.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {eventIds
                    .map((id) => getEventById(id))
                    .filter((e): e is NonNullable<ReturnType<typeof getEventById>> => e != null)
                    .map((ev) => (
                      <EventCard key={ev.id} event={ev} />
                    ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {saving ? "保存中…" : "下書き保存"}
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={saving}
                className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                {saving ? "公開中…" : "公開する"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← 戻る
          </button>
          {step < 6 ? (
            <button
              type="button"
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90"
            >
              次へ
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <p className="text-[var(--foreground-muted)]">読み込み中…</p>
        </div>
      }
    >
      <NewArticleForm />
    </Suspense>
  );
}
