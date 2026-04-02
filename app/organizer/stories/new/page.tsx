"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import type { Story, StoryBlock } from "@/lib/story-types";
import { STORY_TEMPLATE_HEADINGS } from "@/lib/story-types";
import { StoryBlockRenderer } from "@/components/story/story-block-renderer";
import { EventCard } from "@/app/events/event-card";
import { getEvents, getEventById } from "@/lib/events";

const MOCK_ORGANIZER_ID = "org-1";
const MOCK_ORGANIZER_NAME = "地域振興会";

const STEPS = [
  "紐づけるイベント",
  "基本情報",
  "本文",
  "当日の流れ・Q&A",
  "関連イベント",
  "プレビュー",
] as const;

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200";

const HEADINGS = STORY_TEMPLATE_HEADINGS.organizer?.promotion ?? [
  "どんなイベント？",
  "見どころ",
  "当日の流れ",
  "初めての人へ（Q&A）",
  "主催者の想い",
  "関連イベント",
];

function buildBlocks(
  sections: { heading: string; body: string }[],
  timelineItems: { time: string; text: string }[],
  qaItems: { q: string; a: string }[],
  eventIds: string[]
): StoryBlock[] {
  const blocks: StoryBlock[] = [];
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
  if (eventIds.length > 0) blocks.push({ type: "eventEmbed", eventIds });
  return blocks;
}

function NewStoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const eventIdFromQuery = searchParams.get("eventId");

  const [step, setStep] = useState(0);
  const [eventId, setEventId] = useState<string | null>(eventIdFromQuery);
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(DEFAULT_COVER);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [sections, setSections] = useState<{ heading: string; body: string }[]>(
    () => HEADINGS.map((h) => ({ heading: h, body: "" }))
  );
  const [timelineItems, setTimelineItems] = useState<{ time: string; text: string }[]>([
    { time: "", text: "" },
  ]);
  const [qaItems, setQaItems] = useState<{ q: string; a: string }[]>([
    { q: "", a: "" },
  ]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editId) return;
    setSections(HEADINGS.map((h) => ({ heading: h, body: "" })));
  }, [editId]);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/stories/${editId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((story: Story | null) => {
        if (!story) return;
        setEventId(story.eventId);
        setTitle(story.title);
        setLead(story.lead);
        setCoverImageUrl(story.coverImageUrl);
        setTags(story.tags ?? []);
        const secs: { heading: string; body: string }[] = [];
        let ti: { time: string; text: string }[] = [];
        let qa: { q: string; a: string }[] = [];
        let evIds: string[] = [];
        for (const b of story.blocks) {
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
      .catch(() => setError("ストーリーの読み込みに失敗しました"));
  }, [editId]);

  const blocks = buildBlocks(sections, timelineItems, qaItems, eventIds);

  const canNext =
    step === 0 ||
    (step === 1 && title.trim() && lead.trim() && coverImageUrl.trim()) ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5;

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback((i: number) => setTags(tags.filter((_, j) => j !== i)), [tags]);

  const payload = {
    title: title.trim(),
    lead: lead.trim().slice(0, 140),
    coverImageUrl: coverImageUrl.trim() || DEFAULT_COVER,
    tags,
    role: "organizer" as const,
    purpose: "promotion" as const,
    authorId: MOCK_ORGANIZER_ID,
    authorName: MOCK_ORGANIZER_NAME,
    eventId: eventId || null,
    blocks,
  };

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        const res = await fetch(`/api/stories/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "draft" }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "draft" }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      router.push("/organizer/stories");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [editId, payload, router]);

  const publish = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        const res = await fetch(`/api/stories/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "published" }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "published" }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      router.push("/organizer/stories");
    } catch {
      setError("公開に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [editId, payload, router]);

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const allEvents = getEvents();
  const myEvents = allEvents.filter((e) => e.organizerName === MOCK_ORGANIZER_NAME);
  const maxEventEmbed = 6;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Link href="/organizer/stories" className="text-sm text-[var(--foreground-muted)] hover:underline">
            ← ストーリー管理
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {editId ? "ストーリーを編集" : "ストーリーを書く"}
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
                  i === step ? "bg-[var(--accent)] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {s}
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

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">
              このストーリーを紐づけるイベントを選ぶと、イベント詳細ページに表示されます。（任意）
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setEventId(null)}
                className={`w-full rounded-xl border p-4 text-left ${
                  !eventId ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                }`}
              >
                紐づけない
              </button>
              {myEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setEventId(ev.id)}
                  className={`w-full rounded-xl border p-4 text-left ${
                    eventId === ev.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                  }`}
                >
                  {ev.title}（{ev.date}）
                </button>
              ))}
            </div>
          </div>
        )}

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
                  <Image src={coverImageUrl || DEFAULT_COVER} alt="" fill className="object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
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
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                リード（80〜140字） <span className="text-red-500">*</span>
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
                  <span key={t} className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-sm dark:bg-zinc-700">
                    {t}
                    <button type="button" onClick={() => removeTag(i)} className="text-zinc-500 hover:text-zinc-700" aria-label="削除">×</button>
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

        {step === 2 && (
          <div className="space-y-8">
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
                  placeholder="例：この特集では、地域の秋イベントを紹介します。（2〜4行）"
                  rows={4}
                  className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm leading-relaxed dark:bg-zinc-900"
                />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">当日の流れ（任意）</h3>
              {timelineItems.map((item, i) => (
                <div key={i} className="mt-2 flex gap-2">
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
                  <button type="button" onClick={() => setTimelineItems(timelineItems.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-zinc-700">削除</button>
                </div>
              ))}
              <button type="button" onClick={() => setTimelineItems([...timelineItems, { time: "", text: "" }])} className="mt-2 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900">＋ 行を追加</button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">よくある質問（任意）</h3>
              {qaItems.map((item, j) => (
                <div key={j} className="mt-2 rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
                  <input type="text" value={item.q} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], q: e.target.value }; setQaItems(n); }} placeholder="Q. 雨天の場合は？" className="mb-2 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900" />
                  <input type="text" value={item.a} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], a: e.target.value }; setQaItems(n); }} placeholder="A. 小雨決行です。" className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900" />
                  <button type="button" onClick={() => setQaItems(qaItems.filter((_, k) => k !== j))} className="mt-2 text-sm text-zinc-500 hover:underline">削除</button>
                </div>
              ))}
              <button type="button" onClick={() => setQaItems([...qaItems, { q: "", a: "" }])} className="mt-2 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900">＋ Q&Aを追加</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-muted)]">記事内に埋め込む関連イベントを選んでください（最大{maxEventEmbed}件）</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {allEvents.slice(0, 12).map((ev) => {
                const checked = eventIds.includes(ev.id);
                const disabled = !checked && eventIds.length >= maxEventEmbed;
                return (
                  <label key={ev.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${disabled ? "cursor-not-allowed opacity-60" : ""} ${checked ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => { if (e.target.checked) setEventIds([...eventIds, ev.id].slice(0, maxEventEmbed)); else setEventIds(eventIds.filter((id) => id !== ev.id)); }} className="rounded" />
                    <span className="text-sm font-medium line-clamp-1">{ev.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <p className="text-sm text-[var(--foreground-muted)]">［プレビュー］公開前に確認してください。</p>
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-zinc-100">
                <Image src={coverImageUrl || DEFAULT_COVER} alt="" width={672} height={336} className="h-full w-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
              </div>
              <h1 className="mt-6 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{title || "（タイトル）"}</h1>
              <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">{lead || "（リード）"}</p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-8">
                <StoryBlockRenderer blocks={blocks} />
              </div>
              {eventIds.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {eventIds.map((id) => getEventById(id)).filter((e): e is NonNullable<typeof e> => e != null).map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={saveDraft} disabled={saving} className="rounded-lg border border-[var(--border)] bg-white px-6 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">
                {saving ? "保存中…" : "下書き保存"}
              </button>
              <button type="button" onClick={publish} disabled={saving} className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:opacity-90">
                {saving ? "公開中…" : "公開する"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} className="text-sm font-medium text-[var(--accent)] hover:underline">← 戻る</button>
          {step < 5 && (
            <button type="button" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90">次へ</button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OrganizerStoriesNewPage() {
  return (
    <OrganizerRegistrationGate>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
            <p className="text-[var(--foreground-muted)]">読み込み中…</p>
          </div>
        }
      >
        <NewStoryForm />
      </Suspense>
    </OrganizerRegistrationGate>
  );
}
