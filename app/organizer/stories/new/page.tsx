"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import type { Story, StoryBlock } from "@/lib/story-types";
import { StoryBlockRenderer } from "@/components/story/story-block-renderer";
import { getEvents } from "@/lib/events";

const MOCK_ORGANIZER_ID = "org-1";
const MOCK_ORGANIZER_NAME = "地域振興会";
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200";
const STEP_CHIPS = ["紐づけ", "基本情報", "本文", "流れ・Q&A", "関連イベント", "プレビュー"];
const STEP_HD = ["紐づけるイベント", "基本情報を入力", "本文を入力", "当日の流れ・Q&A", "関連イベントを選択", "プレビュー"];
const NEXT_LBL = ["基本情報へ", "本文へ", "流れ・Q&Aへ", "関連イベントへ", "プレビューへ", ""];
const BACK_LBL = ["ストーリー管理へ", "紐づけに戻る", "基本情報に戻る", "本文に戻る", "流れ・Q&Aに戻る", "関連イベントに戻る"];
const BODY_HDS = ["どんなイベント？", "見どころ", "主催者の想い"];
const MAX_EMBED = 6;

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

/* ── SVG helpers ─────────────────────────────────────────────────── */
const ChevL = ({ sz = 12 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ChevRSm = ({ sz = 12 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevLSm = ({ sz = 13 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const CheckIco = ({ sz = 9, col = "#fff" }: { sz?: number; col?: string }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIco = ({ sz = 11 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XClose = ({ sz = 11 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const EyeIco = ({ sz = 9 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const InfoIco = ({ sz = 11, col = "#2a5040" }: { sz?: number; col?: string }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const SaveIco = ({ sz = 11 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" />
  </svg>
);
const UploadIco = ({ sz = 11 }: { sz?: number }) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/* ── Input class constants ───────────────────────────────────────── */
const MI = "w-full px-[11px] py-2 rounded-[10px] border border-[#DEDAD2] bg-[#F5F4EF] text-[13px] outline-none focus:border-[#2B3A6B] focus:bg-white transition-colors font-[inherit]";
const MT = MI + " resize-none leading-[1.7]";
const PI = "w-full px-[11px] py-[7px] rounded-[8px] border border-[#DDD9D0] bg-white text-[12px] outline-none focus:border-[#2B3A6B] transition-colors font-[inherit]";
const PT = PI + " resize-none leading-[1.65]";

/* ── Panel header helper (PC) ────────────────────────────────────── */
function PcPanelHd({
  icBg, icCol, icon, label, extra,
}: {
  icBg: string; icCol: string; icon: React.ReactNode; label: string; extra?: React.ReactNode;
}) {
  return (
    <div className="text-[10px] font-bold text-[#8A877E] tracking-[.1em] uppercase flex items-center gap-[5px] flex-shrink-0">
      <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0" style={{ background: icBg }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={icCol} strokeWidth="2" strokeLinecap="round">{icon}</svg>
      </div>
      {label}{extra && <span>{extra}</span>}
    </div>
  );
}

/* ── Opt / Req badges ────────────────────────────────────────────── */
const OptBadge = ({ pc = false }: { pc?: boolean }) => (
  <span className={`text-[9px] text-[#8A877E] px-[6px] py-[1px] rounded-full border ${pc ? "bg-[#E8E5DE] border-[#DDD9D0]" : "bg-[#F5F4EF] border-[#DEDAD2]"}`}>任意</span>
);
const ReqBadge = ({ pc = false }: { pc?: boolean }) => (
  <span className={`text-[9px] font-semibold px-[5px] py-[1px] rounded ${pc ? "text-[#b05060] bg-[#F5EAEC]" : "text-[#e05060] bg-[#fef2f2]"}`}>必須</span>
);

/* ═══════════════════════════════════════════════════════════════════ */
function NewStoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const eventIdFromQuery = searchParams.get("eventId");

  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState<string | null>(eventIdFromQuery);
  const [title, setTitle] = useState("");
  const [lead, setLead] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(DEFAULT_COVER);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [sections, setSections] = useState(() =>
    BODY_HDS.map((h) => ({ heading: h, body: "" }))
  );
  const [timelineItems, setTimelineItems] = useState([{ time: "", text: "" }]);
  const [qaItems, setQaItems] = useState([{ q: "", a: "" }]);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const coverFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/stories/${editId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((story: Story | null) => {
        if (!story) return;
        setEventId(story.eventId ?? null);
        setTitle(story.title);
        setLead(story.lead);
        setCoverImageUrl(story.coverImageUrl || DEFAULT_COVER);
        setTags(story.tags ?? []);
        const secs: { heading: string; body: string }[] = [];
        let ti: { time: string; text: string }[] = [];
        let qa: { q: string; a: string }[] = [];
        let evIds: string[] = [];
        for (const b of story.blocks) {
          if (b.type === "heading") secs.push({ heading: b.text, body: "" });
          else if (b.type === "paragraph" && secs.length > 0)
            secs[secs.length - 1].body = b.text;
          else if (b.type === "timeline")
            ti = b.items?.length ? b.items : [{ time: "", text: "" }];
          else if (b.type === "qa")
            qa = b.items?.length ? b.items : [{ q: "", a: "" }];
          else if (b.type === "eventEmbed") evIds = b.eventIds ?? [];
        }
        setSections(
          BODY_HDS.map((h, i) => ({
            heading: secs[i]?.heading || h,
            body: secs[i]?.body || "",
          }))
        );
        if (ti.length > 0) setTimelineItems(ti);
        if (qa.length > 0) setQaItems(qa);
        setEventIds(evIds);
      })
      .catch(() => setError("ストーリーの読み込みに失敗しました"));
  }, [editId]);

  const blocks = buildBlocks(sections, timelineItems, qaItems, eventIds);
  const canNext = step !== 2 || (!!title.trim() && !!lead.trim());

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10)
      setTags((prev) => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback(
    (i: number) => setTags((prev) => prev.filter((_, j) => j !== i)),
    []
  );

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
      const url = editId ? `/api/stories/${editId}` : "/api/stories";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, status: "draft" }),
      });
      if (!res.ok) throw new Error(await res.text());
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
      const url = editId ? `/api/stories/${editId}` : "/api/stories";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, status: "published" }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/organizer/stories");
    } catch {
      setError("公開に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [editId, payload, router]);

  const handleCoverFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setCoverImageUrl(String(reader.result));
      reader.readAsDataURL(file);
    },
    []
  );

  const allEvents = getEvents();
  const myEvents = allEvents.filter(
    (e) => e.organizerName === MOCK_ORGANIZER_NAME
  );

  const progress = [
    { name: "紐づけ", status: "✓ なし", done: true },
    { name: "タイトル", status: title.trim() ? "✓ 入力済" : "未入力", done: !!title.trim() },
    { name: "カバー画像", status: coverImageUrl !== DEFAULT_COVER ? "✓ 設定済" : "未設定", done: coverImageUrl !== DEFAULT_COVER },
    { name: "リード文", status: lead.trim() ? "✓ 入力済" : "未入力", done: !!lead.trim() },
    { name: "本文", status: sections.some((s) => s.body.trim()) ? "✓ 入力済" : "未入力", done: sections.some((s) => s.body.trim()) },
    { name: "関連イベント", status: eventIds.length > 0 ? `${eventIds.length}件` : "任意", done: eventIds.length > 0 },
  ];
  const hasWarn = !title.trim() || !lead.trim() || coverImageUrl === DEFAULT_COVER;

  /* ── PC step page/panel wrappers ─────────────────────────────── */
  const stepTx = (s: number) =>
    s < step ? "-100%" : s > step ? "100%" : "0";

  return (
    <div className="-mx-4 -mt-2 min-[900px]:-mx-8 min-[900px]:-mt-8 min-[900px]:-mb-8">
      {/* shared hidden file input */}
      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFile}
      />

      {/* ══════════════ MOBILE ══════════════ */}
      <div className="min-[900px]:hidden flex flex-col bg-[#EDECE7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-[#DEDAD2] px-3 py-[7px] flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() =>
              step > 1 ? setStep((s) => s - 1) : router.back()
            }
            className="w-[26px] h-[26px] rounded-full bg-[#F5F4EF] border border-[#DEDAD2] flex items-center justify-center flex-shrink-0"
          >
            <ChevL sz={12} />
          </button>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[12px] font-semibold">{STEP_HD[step - 1]}</div>
            <div className="text-[10px] text-[#8c8a84]">{step} / 6</div>
          </div>
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="px-[13px] py-[6px] rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex-shrink-0"
          >
            下書き
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-[#DEDAD2] h-[3px] flex-shrink-0">
          <div
            className="bg-[#4fa82a] h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Step chips */}
        <div className="bg-white border-b border-[#DEDAD2] px-3 py-[6px] flex gap-[5px] overflow-x-auto flex-shrink-0 [&::-webkit-scrollbar]:hidden">
          {STEP_CHIPS.map((name, i) => {
            const s = i + 1;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setStep(s)}
                className={`px-2.5 py-1 rounded-full text-[10px] border flex-shrink-0 whitespace-nowrap transition-all ${
                  s === step
                    ? "bg-[#2B3A6B] text-white border-[#2B3A6B]"
                    : s < step
                    ? "bg-[#edf7e4] text-[#3a8a25] border-[#a0d870]"
                    : "bg-[#F5F4EF] text-[#8c8a84] border-[#DEDAD2]"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mt-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 text-[12px] text-[#c04060]">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-[11px] pt-[10px] pb-[4px]">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
              <div className="text-[12px] font-semibold mb-[2px] flex items-center gap-[5px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5060b0" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                紐づけるイベント
              </div>
              <div className="text-[10px] text-[#8c8a84] mb-[9px] leading-relaxed">
                このストーリーを紐づけるイベントを選ぶと、イベント詳細ページに表示されます。（任意）
              </div>
              {[{ id: null, title: "紐づけない", date: "" }, ...myEvents].map((ev) => {
                const sel = ev.id === null ? eventId === null : eventId === ev.id;
                return (
                  <div
                    key={ev.id ?? "__none__"}
                    onClick={() => setEventId(ev.id ?? null)}
                    className={`rounded-[10px] border-[1.5px] px-3 py-[9px] cursor-pointer text-[12px] mb-[6px] last:mb-0 transition-all ${
                      sel
                        ? "border-[#4fa82a] bg-[#edf7e4] font-medium"
                        : "border-[#DEDAD2] bg-[#F5F4EF]"
                    }`}
                  >
                    {ev.title}{ev.date ? `（${ev.date}）` : ""}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
              <div className="text-[12px] font-semibold mb-[2px]">基本情報</div>
              <div className="text-[10px] text-[#8c8a84] mb-[9px]">タイトル・画像・リードを設定します</div>
              {/* title */}
              <div className="mb-[9px]">
                <div className="text-[12px] font-medium mb-[5px] flex items-center gap-[5px]">タイトル <ReqBadge /></div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：秋のイベントまつり特集" className={MI} />
              </div>
              {/* cover */}
              <div className="mb-[9px]">
                <div className="text-[12px] font-medium mb-[5px] flex items-center gap-[5px]">カバー画像 <ReqBadge /></div>
                <div className="w-full h-16 rounded-[9px] overflow-hidden bg-gradient-to-br from-[#1a2540] to-[#2B3A6B] mb-2 flex items-center justify-center">
                  {coverImageUrl ? (
                    <Image src={coverImageUrl} alt="" width={320} height={64} className="w-full h-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex gap-[7px] mb-[7px]">
                  <button type="button" onClick={() => coverFileRef.current?.click()} className="flex-1 py-2 rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex items-center justify-center gap-1">
                    <UploadIco />ファイルを選択
                  </button>
                </div>
                <input type="url" value={coverImageUrl === DEFAULT_COVER ? "" : coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value || DEFAULT_COVER)} placeholder="または 画像 URL を入力" className={MI} />
              </div>
              {/* lead */}
              <div className="mb-[9px]">
                <div className="text-[12px] font-medium mb-[5px] flex items-center gap-[5px]">リード <ReqBadge /></div>
                <textarea rows={4} value={lead} onChange={(e) => setLead(e.target.value.slice(0, 140))} placeholder="例：地域の秋を楽しむイベントを一挙紹介。週末の予定にぴったり…" className={MT} />
                <div className="text-[10px] text-[#8c8a84] text-right mt-[3px]">{lead.length} / 140 文字</div>
                <div className="text-[10px] text-[#8c8a84] mt-[3px]">80〜140字で記入してください</div>
              </div>
              {/* tags */}
              <div>
                <div className="text-[12px] font-medium mb-[5px] flex items-center gap-[5px]">タグ <OptBadge /></div>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                  {tags.map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#EEF1F9] text-[#2B3A6B] text-[11px] px-2 py-0.5">
                      {t}
                      <button type="button" onClick={() => removeTag(i)} className="text-[#8c8a84]"><XClose sz={10} /></button>
                    </span>
                  ))}
                </div>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} onBlur={addTag} placeholder="例：特集、秋、地域" className={MI} />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
              <div className="text-[12px] font-semibold mb-[2px]">本文</div>
              <div className="text-[10px] text-[#8c8a84] mb-[9px]">各セクションに内容を入力してください（2〜4行が目安）</div>
              {sections.map((sec, i) => (
                <div key={i} className="bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2] p-[9px] mb-[7px] last:mb-0">
                  <div className="text-[11px] font-semibold text-[#52504c] mb-[6px]">{sec.heading}</div>
                  <textarea rows={3} value={sec.body} onChange={(e) => { const n = [...sections]; n[i] = { ...n[i], body: e.target.value }; setSections(n); }} placeholder="例：この特集では、地域の秋イベントを紹介します。（2〜4行）" className={MT} />
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <>
              <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
                <div className="text-[12px] font-semibold mb-[2px] flex items-center gap-[5px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a8a25" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  当日の流れ <OptBadge />
                </div>
                <div className="text-[10px] text-[#8c8a84] mb-[9px]">時刻と内容を入力してください</div>
                {timelineItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-[6px] mb-[6px]">
                    <input type="text" value={item.time} onChange={(e) => { const n = [...timelineItems]; n[i] = { ...n[i], time: e.target.value }; setTimelineItems(n); }} placeholder="10:00" className="w-16 px-[7px] py-[7px] rounded-[8px] border border-[#DEDAD2] bg-[#F5F4EF] text-[12px] text-center outline-none focus:border-[#2B3A6B] flex-shrink-0 font-[inherit]" />
                    <input type="text" value={item.text} onChange={(e) => { const n = [...timelineItems]; n[i] = { ...n[i], text: e.target.value }; setTimelineItems(n); }} placeholder="受付開始" className="flex-1 px-[9px] py-[7px] rounded-[8px] border border-[#DEDAD2] bg-[#F5F4EF] text-[12px] outline-none focus:border-[#2B3A6B] font-[inherit]" />
                    <button type="button" onClick={() => setTimelineItems((prev) => prev.filter((_, j) => j !== i))} className="w-7 h-7 rounded-[7px] border border-[#DEDAD2] bg-white text-[#8c8a84] flex items-center justify-center flex-shrink-0">
                      <XClose sz={12} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setTimelineItems((prev) => [...prev, { time: "", text: "" }])} className="inline-flex items-center gap-[5px] px-[13px] py-2 rounded-[9px] border border-dashed border-[#DEDAD2] text-[12px] text-[#2B3A6B] font-medium mt-[6px]">
                  <PlusIco sz={13} />行を追加
                </button>
              </div>
              <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
                <div className="text-[12px] font-semibold mb-[2px] flex items-center gap-[5px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a07a28" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  よくある質問（Q&A） <OptBadge />
                </div>
                {qaItems.map((item, j) => (
                  <div key={j} className="bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2] p-2 mb-[6px]">
                    <input type="text" value={item.q} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], q: e.target.value }; setQaItems(n); }} placeholder="Q. 雨天の場合は？" className="w-full px-[9px] py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[12px] outline-none mb-[6px] font-[inherit]" />
                    <input type="text" value={item.a} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], a: e.target.value }; setQaItems(n); }} placeholder="A. 小雨決行です。" className="w-full px-[9px] py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[12px] outline-none font-[inherit]" />
                    <button type="button" onClick={() => setQaItems((prev) => prev.filter((_, k) => k !== j))} className="text-[11px] text-[#8c8a84] mt-[6px] block">削除</button>
                  </div>
                ))}
                <button type="button" onClick={() => setQaItems((prev) => [...prev, { q: "", a: "" }])} className="inline-flex items-center gap-[5px] px-[13px] py-2 rounded-[9px] border border-dashed border-[#DEDAD2] text-[12px] text-[#2B3A6B] font-medium mt-2">
                  <PlusIco sz={13} />Q&Aを追加
                </button>
              </div>
            </>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="bg-white rounded-[12px] border border-[#DEDAD2] px-[13px] py-[11px] mb-2 shadow-[0_1px_3px_rgba(0,0,0,.05)]">
              <div className="text-[12px] font-semibold mb-[2px] flex items-center gap-[5px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5060b0" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" />
                </svg>
                関連イベント <span className="text-[9px] text-[#8c8a84] px-[6px] py-[1px] bg-[#F5F4EF] rounded-full border border-[#DEDAD2]">任意・最大6件</span>
              </div>
              <div className="text-[10px] text-[#8c8a84] mb-[9px]">記事内に埋め込む関連イベントを選んでください</div>
              {allEvents.slice(0, 12).map((ev) => {
                const checked = eventIds.includes(ev.id);
                const disabled = !checked && eventIds.length >= MAX_EMBED;
                return (
                  <div
                    key={ev.id}
                    onClick={() =>
                      !disabled &&
                      setEventIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== ev.id)
                          : [...prev, ev.id].slice(0, MAX_EMBED)
                      )
                    }
                    className={`flex items-center gap-[9px] px-[11px] py-2 rounded-[10px] border border-[#DEDAD2] mb-[6px] last:mb-0 cursor-pointer transition-all ${checked ? "border-[#4fa82a] bg-[#edf7e4]" : "bg-[#F5F4EF]"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 border-[1.5px] ${checked ? "bg-[#4fa82a] border-[#4fa82a]" : "border-[#DEDAD2]"}`}>
                      {checked && <CheckIco sz={11} />}
                    </div>
                    <span className="text-[13px]">{ev.title}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <>
              {hasWarn && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-[13px] py-[11px] mb-[10px] flex gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05060" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-[1px]">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div className="text-[11px] text-[#c04060] leading-relaxed">タイトル・カバー画像・リード文が未入力です。公開前に入力してください。</div>
                </div>
              )}
              <div className="bg-white rounded-[12px] border border-[#DEDAD2] overflow-hidden mb-2">
                <div className="w-full h-[100px] bg-gradient-to-br from-[#1C2D4A] to-[#2B3A6B] flex items-center justify-center overflow-hidden">
                  {coverImageUrl && (
                    <Image src={coverImageUrl} alt="" width={360} height={100} className="w-full h-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[15px] font-bold mb-[5px]" style={{ fontFamily: "'Noto Serif JP',serif" }}>
                    {title || "（タイトル）"}
                  </div>
                  <div className="text-[12px] text-[#52504c] leading-[1.7] mb-[10px]">
                    {lead || "（リード文がここに表示されます）"}
                  </div>
                  <StoryBlockRenderer blocks={blocks} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="bg-white border-t border-[#DEDAD2] px-3 py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] flex-shrink-0">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-none px-[14px] py-[9px] rounded-[10px] border border-[#DEDAD2] bg-white text-[13px] font-medium flex items-center gap-[5px]"
              >
                <ChevLSm />戻る
              </button>
            )}
            {step < 6 ? (
              <button
                type="button"
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex-1 py-[9px] rounded-[10px] bg-[#2B3A6B] text-[13px] font-semibold text-white flex items-center justify-center gap-[5px] disabled:opacity-50"
              >
                {NEXT_LBL[step - 1]} <ChevRSm />
              </button>
            ) : (
              <button
                type="button"
                onClick={publish}
                disabled={saving}
                className="flex-1 py-[9px] rounded-[10px] bg-[#4fa82a] text-[13px] font-semibold text-white flex items-center justify-center gap-[5px] disabled:opacity-50"
              >
                <CheckIco sz={14} />公開する
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ PC ══════════════ */}
      <div
        className="hidden min-[900px]:flex flex-col bg-[#F0EDE6] overflow-hidden"
        style={{ height: "calc(100dvh - var(--mg-pc-top-nav-h, 56px))" }}
      >
        {/* Step bar */}
        <div className="bg-[#FDFCFA] border-b border-[#DDD9D0] px-5 h-[42px] flex items-center gap-0 flex-shrink-0">
          <button
            type="button"
            onClick={() =>
              step > 1 ? setStep((s) => s - 1) : router.push("/organizer/stories")
            }
            className="flex items-center gap-1 text-[11px] text-[#8A877E] mr-[14px] hover:text-[#2B3A6B] transition-colors flex-shrink-0"
          >
            <ChevL sz={12} />
            <span>{BACK_LBL[step - 1]}</span>
          </button>

          {/* Step indicators */}
          <div className="flex items-center flex-1 min-w-0">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center min-w-0">
                <button
                  type="button"
                  onClick={() => setStep(s)}
                  className="flex items-center gap-1 flex-shrink-0"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all flex-shrink-0 ${
                      s < step
                        ? "bg-[#4a7c5f] text-white"
                        : s === step
                        ? "bg-[#4a7c5f] text-white shadow-[0_1px_5px_rgba(74,124,95,.35)]"
                        : "bg-[#F7F5F0] text-[#8A877E] border border-[#DDD9D0]"
                    }`}
                  >
                    {s < step ? <CheckIco sz={9} /> : s === 6 ? <EyeIco sz={9} /> : s}
                  </div>
                  <span
                    className={`text-[10px] whitespace-nowrap ${
                      s < step
                        ? "text-[#4a7c5f]"
                        : s === step
                        ? "text-[#2B3A6B] font-medium"
                        : "text-[#8A877E]"
                    }`}
                  >
                    {STEP_CHIPS[s - 1]}
                  </span>
                </button>
                {s < 6 && (
                  <div
                    className={`h-px mx-[5px] w-5 flex-shrink-0 ${
                      s < step ? "bg-[#4a7c5f]" : "bg-[#DDD9D0]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step actions */}
          <div className="flex gap-[6px] ml-[14px] flex-shrink-0">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="flex items-center gap-[4px] px-[13px] py-[6px] rounded-[7px] border border-[#DDD9D0] bg-white text-[11px] font-medium text-[#4A4840] hover:bg-[#F7F5F0] transition-colors"
            >
              <SaveIco sz={11} />下書き保存
            </button>
            {step < 6 && (
              <button
                type="button"
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 px-4 py-[6px] rounded-[7px] bg-[#2B3A6B] text-[11px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {NEXT_LBL[step - 1]} <ChevRSm sz={12} />
              </button>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Step area */}
          <div className="flex-1 overflow-hidden relative min-w-0">

            {/* ── PC STEP 1: 紐づけ (1col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(1)})`, pointerEvents: step === 1 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-1 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#EEF1F9" icCol="#2B3A6B" label="紐づけるイベント"
                  icon={<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>}
                />
                <div className="text-[11px] text-[#8A877E] leading-[1.55] flex-shrink-0">
                  このストーリーを紐づけるイベントを選ぶと、そのイベント詳細ページにも表示されます。（任意）
                </div>
                {[{ id: null, title: "紐づけない", date: "" }, ...myEvents].map((ev) => {
                  const sel = ev.id === null ? eventId === null : eventId === ev.id;
                  return (
                    <div
                      key={ev.id ?? "__none__"}
                      onClick={() => setEventId(ev.id ?? null)}
                      className={`rounded-[8px] border-[1.5px] px-[14px] py-[9px] cursor-pointer text-[12px] transition-all flex-shrink-0 ${
                        sel
                          ? "border-[#4a7c5f] bg-[#EAF2EC] font-medium text-[#4a7c5f]"
                          : "border-[#DDD9D0] bg-white text-[#4A4840] hover:border-[#4a7c5f] hover:bg-[#EAF2EC]"
                      }`}
                    >
                      {ev.title}{ev.date ? `（${ev.date}）` : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── PC STEP 2: 基本情報 (2col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(2)})`, pointerEvents: step === 2 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-2 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              {/* left */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0] border-r border-[#DDD9D0]">
                <PcPanelHd icBg="#EEF1F9" icCol="#2B3A6B" label="タイトル・リード"
                  icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                />
                <div className="flex flex-col gap-[4px] flex-shrink-0">
                  <div className="text-[12px] font-medium text-[#4A4840] flex items-center gap-1">タイトル <ReqBadge pc /></div>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：秋のイベントまつり特集" className={PI} />
                </div>
                <div className="flex flex-col gap-[4px] flex-1 min-h-0">
                  <div className="text-[12px] font-medium text-[#4A4840] flex items-center gap-1">リード <ReqBadge pc /></div>
                  <textarea value={lead} onChange={(e) => setLead(e.target.value.slice(0, 140))} placeholder="例：地域の秋を楽しむイベントを一挙紹介。週末の予定にぴったり…" className={PT + " flex-1 min-h-[80px]"} />
                  <div className="text-[10px] text-[#8A877E] text-right">{lead.length} / 140 文字（80〜140字がおすすめ）</div>
                </div>
                <div className="flex flex-col gap-[4px] flex-shrink-0">
                  <div className="text-[12px] font-medium text-[#4A4840] flex items-center gap-1">タグ <OptBadge pc /></div>
                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {tags.map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#EEF1F9] text-[#2B3A6B] text-[11px] px-2 py-0.5">
                        {t}<button type="button" onClick={() => removeTag(i)} className="text-[#8A877E]"><XClose sz={9} /></button>
                      </span>
                    ))}
                  </div>
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} onBlur={addTag} placeholder="例：特集、秋、地域（カンマ区切り）" className={PI} />
                </div>
              </div>
              {/* right */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#F5EFE4" icCol="#b07830" label="カバー画像"
                  icon={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>}
                  extra={<ReqBadge pc />}
                />
                <div className="bg-white rounded-[8px] border border-[#DDD9D0] p-[9px] flex-1 min-h-0 flex flex-col gap-2">
                  <div className="rounded-[6px] overflow-hidden bg-gradient-to-br from-[#1C2D4A] to-[#2B3A6B] flex items-center justify-center flex-1 min-h-[80px]">
                    {coverImageUrl ? (
                      <Image src={coverImageUrl} alt="" width={300} height={180} className="w-full h-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex gap-[6px] flex-shrink-0">
                    <button type="button" onClick={() => coverFileRef.current?.click()} className="flex-1 py-[6px] rounded-[7px] border border-[#DDD9D0] bg-[#F7F5F0] text-[11px] flex items-center justify-center gap-1 text-[#4A4840] hover:bg-[#E8E5DE] transition-colors">
                      <UploadIco sz={11} />ファイルを選択
                    </button>
                  </div>
                  <input type="url" value={coverImageUrl === DEFAULT_COVER ? "" : coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value || DEFAULT_COVER)} placeholder="または 画像 URL を入力" className={PI + " flex-shrink-0"} />
                </div>
              </div>
            </div>

            {/* ── PC STEP 3: 本文 (2col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(3)})`, pointerEvents: step === 3 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-2 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              {/* left */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0] border-r border-[#DDD9D0]">
                <PcPanelHd icBg="#EEF1F9" icCol="#2B3A6B" label="本文（前半）"
                  icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                />
                {[0, 1].map((i) => (
                  <div key={i} className="bg-white rounded-[8px] border border-[#DDD9D0] p-[9px] flex flex-col gap-[7px] flex-1 min-h-0">
                    <div className="text-[11px] font-semibold text-[#4A4840] pb-[6px] border-b border-[#E8E5DE] flex-shrink-0">{sections[i].heading}</div>
                    <textarea value={sections[i].body} onChange={(e) => { const n = [...sections]; n[i] = { ...n[i], body: e.target.value }; setSections(n); }} placeholder="例：この特集では、地域の秋イベントを紹介します。（2〜4行）" className={PT + " flex-1 min-h-[60px]"} />
                  </div>
                ))}
              </div>
              {/* right */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#F5EAEC" icCol="#b05060" label="本文（後半）"
                  icon={<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />}
                />
                <div className="bg-white rounded-[8px] border border-[#DDD9D0] p-[9px] flex flex-col gap-[7px] flex-1 min-h-0">
                  <div className="text-[11px] font-semibold text-[#4A4840] pb-[6px] border-b border-[#E8E5DE] flex-shrink-0">{sections[2].heading}</div>
                  <textarea value={sections[2].body} onChange={(e) => { const n = [...sections]; n[2] = { ...n[2], body: e.target.value }; setSections(n); }} placeholder="例：この特集では、地域の秋イベントを紹介します。（2〜4行）" className={PT + " flex-1 min-h-[60px]"} />
                </div>
                <div className="bg-[#EEF3F0] rounded-[8px] border border-[#b8d4c4] p-[10px] flex-shrink-0">
                  <div className="text-[11px] font-medium text-[#2a5040] mb-1 flex items-center gap-1"><InfoIco sz={11} />本文のヒント</div>
                  <div className="text-[10px] text-[#2a5040] leading-[1.6]">各セクションは2〜4行が読みやすいです。見出しは内容に合わせて変更もできます。</div>
                </div>
              </div>
            </div>

            {/* ── PC STEP 4: 流れ・Q&A (2col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(4)})`, pointerEvents: step === 4 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-2 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              {/* left: timeline */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0] border-r border-[#DDD9D0]">
                <PcPanelHd icBg="#EAF2EC" icCol="#4a7c5f" label="当日の流れ"
                  icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                  extra={<OptBadge pc />}
                />
                <div className="flex flex-col gap-[5px] flex-shrink-0">
                  {timelineItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-[6px]">
                      <div className="w-16 flex-shrink-0">
                        <input type="text" value={item.time} onChange={(e) => { const n = [...timelineItems]; n[i] = { ...n[i], time: e.target.value }; setTimelineItems(n); }} placeholder="10:00" className="w-full px-2 py-[6px] text-[11px] text-center rounded-[6px] border border-[#DDD9D0] bg-white outline-none focus:border-[#2B3A6B] font-[inherit]" />
                      </div>
                      <div className="flex-1">
                        <input type="text" value={item.text} onChange={(e) => { const n = [...timelineItems]; n[i] = { ...n[i], text: e.target.value }; setTimelineItems(n); }} placeholder="受付開始" className="w-full px-[10px] py-[6px] text-[11px] rounded-[6px] border border-[#DDD9D0] bg-white outline-none focus:border-[#2B3A6B] font-[inherit]" />
                      </div>
                      <button type="button" onClick={() => setTimelineItems((prev) => prev.filter((_, j) => j !== i))} className="w-[26px] h-[26px] rounded-[6px] border border-[#DDD9D0] bg-white text-[#8A877E] flex items-center justify-center flex-shrink-0 hover:bg-[#F5EAEC] hover:text-[#b05060] hover:border-[#d0a0a8] transition-colors">
                        <XClose sz={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setTimelineItems((prev) => [...prev, { time: "", text: "" }])} className="inline-flex items-center gap-1 px-[11px] py-[6px] rounded-[7px] border border-dashed border-[#DDD9D0] text-[11px] text-[#2B3A6B] font-medium hover:bg-[#EEF1F9] hover:border-[#2B3A6B] transition-all flex-shrink-0">
                  <PlusIco sz={11} />行を追加
                </button>
              </div>
              {/* right: Q&A */}
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#F5EFE4" icCol="#b07830" label="よくある質問（Q&A）"
                  icon={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>}
                  extra={<OptBadge pc />}
                />
                <div className="flex flex-col gap-[7px] flex-shrink-0">
                  {qaItems.map((item, j) => (
                    <div key={j} className="bg-white rounded-[8px] border border-[#DDD9D0] p-[9px] flex-shrink-0">
                      <input type="text" value={item.q} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], q: e.target.value }; setQaItems(n); }} placeholder="Q. 雨天の場合は？" className="w-full px-[10px] py-[6px] rounded-[6px] border border-[#DDD9D0] bg-[#F7F5F0] text-[11px] outline-none focus:border-[#2B3A6B] mb-[5px] font-[inherit]" />
                      <input type="text" value={item.a} onChange={(e) => { const n = [...qaItems]; n[j] = { ...n[j], a: e.target.value }; setQaItems(n); }} placeholder="A. 小雨決行です。" className="w-full px-[10px] py-[6px] rounded-[6px] border border-[#DDD9D0] bg-[#F7F5F0] text-[11px] outline-none focus:border-[#2B3A6B] font-[inherit]" />
                      <button type="button" onClick={() => setQaItems((prev) => prev.filter((_, k) => k !== j))} className="text-[10px] text-[#8A877E] mt-[5px] block hover:text-[#b05060] transition-colors">削除</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setQaItems((prev) => [...prev, { q: "", a: "" }])} className="inline-flex items-center gap-1 px-[11px] py-[6px] rounded-[7px] border border-dashed border-[#DDD9D0] text-[11px] text-[#2B3A6B] font-medium hover:bg-[#EEF1F9] hover:border-[#2B3A6B] transition-all flex-shrink-0">
                  <PlusIco sz={11} />Q&Aを追加
                </button>
              </div>
            </div>

            {/* ── PC STEP 5: 関連イベント (1col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(5)})`, pointerEvents: step === 5 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-1 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#EEF1F9" icCol="#2B3A6B" label="関連イベントを選択"
                  icon={<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" /></>}
                  extra={<OptBadge pc />}
                />
                <div className="text-[11px] text-[#8A877E] leading-[1.55] flex-shrink-0">
                  記事内に埋め込む関連イベントを選んでください。選択したイベントはカード形式で表示されます。
                </div>
                <div className="flex flex-col gap-[5px] flex-shrink-0">
                  {allEvents.slice(0, 12).map((ev) => {
                    const checked = eventIds.includes(ev.id);
                    const disabled = !checked && eventIds.length >= MAX_EMBED;
                    return (
                      <div
                        key={ev.id}
                        onClick={() =>
                          !disabled &&
                          setEventIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== ev.id)
                              : [...prev, ev.id].slice(0, MAX_EMBED)
                          )
                        }
                        className={`flex items-center gap-[9px] px-3 py-2 rounded-[8px] border cursor-pointer transition-all ${checked ? "border-[#4a7c5f] bg-[#EAF2EC]" : "border-[#DDD9D0] bg-white hover:border-[#4a7c5f]"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`w-[15px] h-[15px] rounded flex items-center justify-center flex-shrink-0 border-[1.5px] transition-all ${checked ? "bg-[#4a7c5f] border-[#4a7c5f]" : "border-[#DDD9D0]"}`}>
                          {checked && <CheckIco sz={9} />}
                        </div>
                        <span className="text-[12px] text-[#4A4840]">{ev.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── PC STEP 6: プレビュー (1col) ── */}
            <div
              style={{ transform: `translateX(${stepTx(6)})`, pointerEvents: step === 6 ? "all" : "none" }}
              className="absolute inset-0 grid grid-cols-1 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            >
              <div className="overflow-y-auto flex flex-col gap-[10px] p-4 bg-[#F7F5F0]">
                <PcPanelHd icBg="#EAF2EC" icCol="#4a7c5f" label="プレビュー"
                  icon={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                />
                <div className="text-[11px] text-[#8A877E] flex-shrink-0">公開前に内容を確認してください</div>
                <div className="bg-white rounded-[12px] border border-[#DDD9D0] overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
                  <div className="h-[120px] bg-gradient-to-br from-[#1C2D4A] to-[#2B3A6B] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {coverImageUrl && (
                      <Image src={coverImageUrl} alt="" width={600} height={120} className="w-full h-full object-cover" unoptimized={coverImageUrl.startsWith("data:")} />
                    )}
                  </div>
                  <div className="p-[14px] overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[#DDD9D0] [&::-webkit-scrollbar-thumb]:rounded">
                    <div className="text-[15px] font-bold mb-[5px]" style={{ fontFamily: "'Noto Serif JP',serif" }}>
                      {title || "（タイトル）"}
                    </div>
                    <div className="text-[11px] text-[#4A4840] leading-[1.7] mb-[10px]">
                      {lead || "（リード文がここに表示されます）"}
                    </div>
                    <StoryBlockRenderer blocks={blocks} />
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /step-area */}

          {/* Right side panel */}
          <div className="w-56 flex-shrink-0 bg-[#FDFCFA] border-l border-[#DDD9D0] flex flex-col overflow-hidden">
            {/* Progress */}
            <div className="px-4 py-[14px] border-b border-[#E8E5DE]">
              <div className="text-[9px] font-bold text-[#8A877E] tracking-[.1em] uppercase mb-2 flex items-center gap-[5px]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                入力の進捗
              </div>
              {progress.map((p) => (
                <div key={p.name} className="flex items-center gap-[7px] py-[5px] border-b border-[#E8E5DE] last:border-0">
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: p.done ? "#4a7c5f" : "#c8c2b5" }} />
                  <span className="text-[11px] flex-1 text-[#4A4840]">{p.name}</span>
                  <span className="text-[10px]" style={{ color: p.done ? "#4a7c5f" : "#8A877E" }}>{p.status}</span>
                </div>
              ))}
            </div>
            {/* Hint */}
            <div className="px-4 py-[14px] border-b border-[#E8E5DE]">
              <div className="bg-[#EEF3F0] rounded-[8px] border border-[#b8d4c4] p-[10px]">
                <div className="text-[11px] font-medium text-[#2a5040] mb-1 flex items-center gap-1">
                  <InfoIco sz={11} />ストーリーとは
                </div>
                <div className="text-[10px] text-[#2a5040] leading-[1.6]">
                  イベントの魅力・当日の流れ・主催者の想いを読み物として発信できます。紐づけると、イベント詳細ページにも表示されます。
                </div>
              </div>
            </div>
            {/* Save buttons */}
            <div className="px-4 py-[14px] mt-auto border-t border-[#E8E5DE]">
              {hasWarn && (
                <div className="bg-[#FEF5F0] rounded-[8px] border border-[#e0b8a8] p-[9px] text-[10px] text-[#8a4030] leading-[1.6] mb-[10px]">
                  タイトル・カバー画像・リード文が未入力です。公開前に入力してください。
                </div>
              )}
              {error && (
                <div className="text-[11px] text-[#b05060] mb-2">{error}</div>
              )}
              <div className="flex flex-col gap-[6px]">
                <button type="button" onClick={saveDraft} disabled={saving} className="flex items-center justify-center gap-[5px] py-[9px] rounded-[8px] border border-[#DDD9D0] bg-white text-[12px] font-medium text-[#4A4840] w-full hover:bg-[#F7F5F0] transition-colors disabled:opacity-50">
                  <SaveIco sz={11} />下書き保存
                </button>
                <button type="button" onClick={publish} disabled={saving} className="flex items-center justify-center gap-[5px] py-[9px] rounded-[8px] bg-[#4a7c5f] text-[12px] font-semibold text-white w-full hover:opacity-90 transition-opacity disabled:opacity-50">
                  <CheckIco sz={11} />公開する
                </button>
              </div>
            </div>
          </div>

        </div>{/* /workspace */}
      </div>{/* /PC */}

    </div>
  );
}

export default function OrganizerStoriesNewPage() {
  return (
    <OrganizerRegistrationGate>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <p className="text-sm text-[var(--foreground-muted)]">読み込み中…</p>
          </div>
        }
      >
        <NewStoryForm />
      </Suspense>
    </OrganizerRegistrationGate>
  );
}
