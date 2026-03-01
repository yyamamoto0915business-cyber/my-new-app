"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Story, StoryBlock } from "@/lib/story-types";
import {
  STORY_ROLE_LABELS,
  STORY_PURPOSE_LABELS,
  STORY_TEMPLATE_HEADINGS,
} from "@/lib/story-types";
import { StoryBlockRenderer } from "@/components/story/story-block-renderer";
import { getEventById } from "@/lib/events";

const MOCK_USER_ID = "user-1";
const MOCK_USER_NAME = "参加者";

const STEPS = ["立場・目的", "基本情報", "本文", "プレビュー"] as const;
const DEFAULT_COVER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200";

type Role = "volunteer" | "staff" | "participant";
type Purpose = "report" | "debrief";

function getHeadings(role: Role, purpose: Purpose): string[] {
  const byRole = STORY_TEMPLATE_HEADINGS[role];
  if (!byRole) return ["本文"];
  const headings = purpose === "debrief" ? byRole.debrief : byRole.report;
  return headings ?? ["本文"];
}

function buildBlocks(
  sections: { heading: string; body: string }[]
): StoryBlock[] {
  const blocks: StoryBlock[] = [];
  sections.forEach((s) => {
    if (s.heading.trim()) blocks.push({ type: "heading", text: s.heading });
    if (s.body.trim()) blocks.push({ type: "paragraph", text: s.body });
  });
  return blocks;
}

function ReportNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("participant");
  const [purpose, setPurpose] = useState<Purpose>("report");
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(DEFAULT_COVER);
  const [tags, setTags] = useState<string[]>([]);
  const [sections, setSections] = useState<{ heading: string; body: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headings = getHeadings(role, purpose);

  useEffect(() => {
    setSections(headings.map((h) => ({ heading: h, body: "" })));
  }, [role, purpose]);

  const blocks = buildBlocks(sections);

  const canNext =
    (step === 0 && role && purpose) ||
    (step === 1 && title.trim() && lead.trim() && coverImageUrl.trim()) ||
    step === 2 ||
    step === 3;

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const publish = useCallback(async () => {
    if (!eventId) return;
    setSaving(true);
    setError("");
    const payload = {
      title: title.trim(),
      lead: lead.trim().slice(0, 140),
      coverImageUrl: coverImageUrl.trim() || DEFAULT_COVER,
      tags,
      role,
      purpose,
      authorId: MOCK_USER_ID,
      authorName: MOCK_USER_NAME,
      eventId,
      blocks,
      status: "published",
    };
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const story = await res.json();
      router.push(`/stories/${story.slug}`);
    } catch {
      setError("公開に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [eventId, title, lead, coverImageUrl, tags, role, purpose, blocks, router]);

  const event = eventId ? getEventById(eventId) : null;

  if (!eventId) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-8">
        <p className="text-[var(--foreground-muted)]">イベントが指定されていません。</p>
        <Link href="/volunteer" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
          ボランティア募集から選ぶ →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Link href={`/events/${eventId}`} className="text-sm text-[var(--foreground-muted)] hover:underline">
            ← イベントに戻る
          </Link>
          <h1 className="mt-2 font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            レポを書く
          </h1>
          {event && <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">{event.title}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded px-2 py-0.5 text-xs ${
                  i === step ? "bg-[var(--accent)] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {s}
              </span>
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">立場</label>
              <div className="mt-2 space-y-2">
                {(["participant", "volunteer", "staff"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`w-full rounded-xl border p-4 text-left ${
                      role === r ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                    }`}
                  >
                    {STORY_ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">目的</label>
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setPurpose("report")}
                  className={`w-full rounded-xl border p-4 text-left ${
                    purpose === "report" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                  }`}
                >
                  {STORY_PURPOSE_LABELS.report}
                </button>
                {role === "staff" && (
                  <button
                    type="button"
                    onClick={() => setPurpose("debrief")}
                    className={`w-full rounded-xl border p-4 text-left ${
                      purpose === "debrief" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white dark:bg-[var(--background)]"
                    }`}
                  >
                    {STORY_PURPOSE_LABELS.debrief}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">タイトル <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：陶芸体験に参加して"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">カバー画像 <span className="text-red-500">*</span></label>
              <div className="mt-1 flex flex-wrap gap-4">
                <div className="relative h-28 w-40 overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-100">
                  <Image src={coverImageUrl || DEFAULT_COVER} alt="" fill className="object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
                </div>
                <div className="flex flex-col gap-2">
                  <input type="url" value={coverImageUrl === DEFAULT_COVER ? "" : coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value || DEFAULT_COVER)} placeholder="画像URL" className="w-64 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-zinc-900" />
                  <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-center text-sm dark:bg-zinc-900">
                    ファイルを選択
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">リード（80〜140字） <span className="text-red-500">*</span></label>
              <input type="text" value={lead} onChange={(e) => setLead(e.target.value.slice(0, 140))} placeholder="例：初めての陶芸体験に参加したレポです。" maxLength={140} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900" />
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{lead.length} / 140</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">タグ <span className="text-[var(--foreground-muted)]">（任意）</span></label>
              <input type="text" value={tags.join(" ")} onChange={(e) => setTags(e.target.value.trim() ? e.target.value.split(/\s+/) : [])} placeholder="例：参加レポ 陶芸" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 dark:bg-zinc-900" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {sections.map((sec, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
                <input type="text" value={sec.heading} onChange={(e) => { const n = [...sections]; n[i] = { ...n[i], heading: e.target.value }; setSections(n); }} placeholder="見出し" className="mb-3 w-full rounded border border-[var(--border)] bg-white px-3 py-2 font-serif text-lg dark:bg-zinc-900" />
                <textarea value={sec.body} onChange={(e) => { const n = [...sections]; n[i] = { ...n[i], body: e.target.value }; setSections(n); }} placeholder="例：当日の様子を書いてください。（2〜4行）" rows={4} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm leading-relaxed dark:bg-zinc-900" />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-zinc-100">
                <Image src={coverImageUrl || DEFAULT_COVER} alt="" width={672} height={336} className="h-full w-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
              </div>
              <h1 className="mt-6 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{title || "（タイトル）"}</h1>
              <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">{lead || "（リード）"}</p>
              <div className="mt-8">
                <StoryBlockRenderer blocks={blocks} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={publish} disabled={saving} className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:opacity-90">
                {saving ? "公開中…" : "公開する"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} className="text-sm font-medium text-[var(--accent)] hover:underline">← 戻る</button>
          {step < 3 && <button type="button" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90">次へ</button>}
        </div>
      </main>
    </div>
  );
}

export default function ReportNewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--background)]"><p className="text-[var(--foreground-muted)]">読み込み中…</p></div>}>
      <ReportNewForm />
    </Suspense>
  );
}
