"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, Mail, Send } from "lucide-react";
import {
  CONTACT_BODY_MAX,
  CONTACT_CATEGORIES,
  CONTACT_SUBJECT_MAX,
  type ContactCategory,
} from "@/lib/contact";

const MOBILE_HERO = "/volunteer/mobile-hero-watercolor.png";
const PC_HERO_BG = "/contact/pc-hero-bg.png";
const LEAF_ICON = "/assets/machiglyph/checkin/icons/leaf_icon.svg";

const INP =
  "w-full min-w-0 rounded-[10px] border border-[#d8e4dc] bg-[#fafaf8] px-3.5 py-2.5 text-[14px] text-[#1e3828] outline-none transition placeholder:text-[#9ab0a0] focus:border-[#4a7a5c] focus:bg-white";

const INP_PC =
  "w-full min-w-0 rounded-[10px] border border-[#d5e6da] bg-[#f8fbf9] px-3.5 py-[10px] text-[14px] text-[#1e3828] outline-none transition placeholder:text-[#9ab0a0] focus:border-[#4a7a5c] focus:bg-white";

function ReqBadge({ tone = "red" }: { tone?: "red" | "amber" }) {
  const cls =
    tone === "amber"
      ? "ml-1.5 inline-flex items-center rounded px-[5px] py-[1px] text-[9px] font-semibold text-[#c47a2a] bg-[#fdf3e6]"
      : "ml-1.5 inline-flex items-center rounded px-[5px] py-[1px] text-[9px] font-semibold text-[#e05060] bg-[#fef2f2]";
  return <span className={cls}>必須</span>;
}

function EnvelopeSpotlight() {
  return (
    <div
      className="relative mx-auto flex h-[148px] w-[148px] items-center justify-center"
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, #ffffff 0%, #eaf5ee 48%, rgba(246,250,247,0) 74%)",
        }}
      />
      <div className="absolute inset-[14px] rounded-full border border-[#c8ddd0]/60" />

      <Send
        className="absolute right-[16px] top-[20px] h-[15px] w-[15px] -rotate-[18deg] text-[#5a9a72]"
        strokeWidth={1.8}
      />
      <Send
        className="absolute bottom-[28px] left-[16px] h-[12px] w-[12px] rotate-[-38deg] text-[#8bb89a]/80"
        strokeWidth={1.8}
      />
      <span className="absolute left-[34px] top-[36px] h-1 w-1 rounded-full bg-[#a8c8b4]" />
      <span className="absolute bottom-[44px] right-[34px] h-1.5 w-1.5 rounded-full bg-[#c8a84b]/55" />

      <svg
        viewBox="0 0 120 100"
        className="relative z-[1] h-[88px] w-[108px] drop-shadow-[0_6px_14px_rgba(47,107,79,0.18)]"
        fill="none"
      >
        {/* Back flap */}
        <path d="M18 38 L60 10 L102 38" fill="#4a9470" />
        {/* Envelope body */}
        <path
          d="M14 36 H106 V86 C106 90 103 93 99 93 H21 C17 93 14 90 14 86 V36 Z"
          fill="#2f6b4f"
        />
        {/* Side folds */}
        <path d="M14 36 L60 66 L14 86 Z" fill="#265a42" opacity="0.35" />
        <path d="M106 36 L60 66 L106 86 Z" fill="#265a42" opacity="0.22" />
        {/* Front V edge */}
        <path
          d="M14 36 L60 64 L106 36"
          stroke="#5aad7c"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
          opacity="0.55"
        />
        {/* Letter */}
        <rect
          x="36"
          y="18"
          width="48"
          height="58"
          rx="3"
          fill="#ffffff"
          stroke="#e4efe8"
          strokeWidth="1"
        />
        <rect x="44" y="30" width="8" height="8" rx="1.5" fill="#2f6b4f" opacity="0.75" />
        <rect x="55" y="32" width="21" height="3" rx="1.5" fill="#c5d6cb" />
        <rect x="44" y="44" width="32" height="2.5" rx="1.25" fill="#d5e2da" />
        <rect x="44" y="51" width="32" height="2.5" rx="1.25" fill="#d5e2da" />
        <rect x="44" y="58" width="24" height="2.5" rx="1.25" fill="#d5e2da" />
        <rect x="44" y="65" width="18" height="2.5" rx="1.25" fill="#d5e2da" />
      </svg>
    </div>
  );
}

export function ContactPageClient() {
  const [category, setCategory] = useState<ContactCategory | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    category !== "" &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    body.length <= CONTACT_BODY_MAX &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (category === "" || !subject.trim() || !body.trim() || submitting) return;
    if (body.length > CONTACT_BODY_MAX) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(json?.error ?? "送信に失敗しました。しばらくしてからお試しください。");
        return;
      }

      setDone(true);
      setCategory("");
      setSubject("");
      setBody("");
    } catch {
      setError("送信に失敗しました。通信環境をご確認ください。");
    } finally {
      setSubmitting(false);
    }
  }

  const formFields = (variant: "mobile" | "pc") => {
    const inp = variant === "pc" ? INP_PC : INP;
    const badgeTone = variant === "pc" ? "amber" : "red";
    const idPrefix = variant === "pc" ? "pc" : "mobile";

    return (
      <>
        <div>
          <label
            htmlFor={`${idPrefix}-contact-category`}
            className="mb-1.5 flex items-center text-[12px] font-medium text-[#1e3828] min-[900px]:text-[13px]"
          >
            お問い合わせ内容
            <ReqBadge tone={badgeTone} />
          </label>
          <select
            id={`${idPrefix}-contact-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory | "")}
            className={inp}
            required
          >
            <option value="">選択してください</option>
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-contact-subject`}
            className="mb-1.5 flex items-center text-[12px] font-medium text-[#1e3828] min-[900px]:text-[13px]"
          >
            件名
            <ReqBadge tone={badgeTone} />
          </label>
          <input
            id={`${idPrefix}-contact-subject`}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, CONTACT_SUBJECT_MAX))}
            placeholder="例）イベントについて"
            className={inp}
            maxLength={CONTACT_SUBJECT_MAX}
            required
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-contact-body`}
            className="mb-1.5 flex items-center text-[12px] font-medium text-[#1e3828] min-[900px]:text-[13px]"
          >
            {variant === "pc" ? "お問い合わせ内容" : "詳細"}
            <ReqBadge tone={badgeTone} />
          </label>
          <textarea
            id={`${idPrefix}-contact-body`}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, CONTACT_BODY_MAX))}
            placeholder="お問い合わせ内容をご入力ください"
            className={`${inp} resize-y leading-[1.65] ${
              variant === "pc" ? "min-h-[108px]" : "min-h-[96px] sm:min-h-[120px]"
            }`}
            maxLength={CONTACT_BODY_MAX}
            required
          />
          <p className="mt-1 text-right text-[11px] text-[#7a9888]">
            {body.length} / {CONTACT_BODY_MAX}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
          >
            {error}
          </p>
        )}
      </>
    );
  };

  const donePanel = (
    <div className="rounded-[14px] border border-[#c8dcd0] bg-white px-5 py-6 text-center sm:px-8">
      <p className="text-[15px] font-semibold text-[#1e3828]">送信しました</p>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[#4a6858]">
        内容を確認のうえ、登録メールアドレス宛にご連絡します。
      </p>
      <button
        type="button"
        onClick={() => setDone(false)}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#2f6b4f] px-6 text-[14px] font-semibold text-white transition hover:bg-[#265a42]"
      >
        別のお問い合わせを送る
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--mg-paper)] min-[900px]:bg-[#eef3f0]">
      {/* —— Mobile —— */}
      <main className="mx-auto max-w-2xl px-4 py-3 sm:px-6 sm:py-6 min-[900px]:hidden">
        <section className="relative overflow-hidden rounded-[14px] bg-[#eef6f0]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%]">
            <Image
              src={MOBILE_HERO}
              alt=""
              fill
              priority
              className="object-cover object-[center_35%] opacity-80"
              sizes="55vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#eef6f0] via-[#eef6f0]/70 to-transparent"
              aria-hidden
            />
          </div>
          <div className="relative z-[1] flex items-start gap-3 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2f6b4f] shadow-sm">
              <Mail className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[18px] font-bold tracking-tight text-[#1e3828]">
                お問い合わせ
              </h1>
              <p className="mt-0.5 text-[12px] leading-[1.5] text-[#4a6858]">
                ご質問・ご相談など、お気軽にお問い合わせください。
              </p>
            </div>
          </div>
        </section>

        {done ? (
          <div className="mt-4">{donePanel}</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {formFields("mobile")}
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#2f6b4f] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#265a42] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              {submitting ? "送信中…" : "送信する"}
            </button>
          </form>
        )}

        <aside className="mt-4 flex gap-2.5 rounded-[12px] bg-[#e8f4ec] px-3.5 py-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f6b4f]/12 text-[#2f6b4f]">
            <Bell className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-[#1e3828]">
              管理者からの通知について
            </p>
            <p className="mt-0.5 text-[11px] leading-[1.55] text-[#4a6858]">
              送信後、管理者が内容を確認し、登録メール宛にご連絡します。
            </p>
          </div>
        </aside>
      </main>

      {/* —— PC —— */}
      <main className="relative mx-auto hidden max-w-[940px] px-6 py-5 min-[900px]:block min-[1200px]:px-8">
        {/* Soft page atmosphere */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[220px] overflow-hidden opacity-[0.35]"
          aria-hidden
        >
          <Image
            src={PC_HERO_BG}
            alt=""
            fill
            className="object-cover object-[center_30%]"
            sizes="940px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#eef3f0]/40 via-[#eef3f0]/85 to-[#eef3f0]" />
        </div>
        <Image
          src={LEAF_ICON}
          alt=""
          width={80}
          height={80}
          className="pointer-events-none absolute bottom-1 right-2 opacity-[0.1]"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-[18px] border border-[#d5e4da] bg-white shadow-[0_4px_24px_rgba(30,56,40,0.06)]">
          {/* Hero band */}
          <section className="relative min-h-[112px] overflow-hidden border-b border-[#e8efe9]">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%]">
              <Image
                src={PC_HERO_BG}
                alt=""
                fill
                priority
                className="object-cover object-right"
                sizes="580px"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/10"
                aria-hidden
              />
            </div>
            <div className="relative z-[1] flex items-center gap-4 px-7 py-5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(30,56,40,0.1)] ring-1 ring-[#e4efe8]">
                <Mail className="h-6 w-6 text-[#2f6b4f]" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 max-w-[400px]">
                <h1 className="text-[24px] font-bold tracking-tight text-[#1a2e22]">
                  お問い合わせ
                </h1>
                <p className="mt-1 text-[13px] leading-[1.65] text-[#3a5848]">
                  ご質問・ご相談など、お気軽にお問い合わせください。
                  <br />
                  内容を確認後、管理者よりご連絡いたします。
                </p>
              </div>
            </div>
          </section>

          {done ? (
            <div className="p-10">{donePanel}</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-[260px_1fr]">
              {/* Left panel */}
              <aside className="flex flex-col items-center border-r border-[#e8efe9] bg-[#f6faf7] px-6 py-6">
                <EnvelopeSpotlight />
                <h2 className="mt-1 w-full text-center text-[15px] font-bold leading-[1.45] text-[#1e3828]">
                  皆さまの声を
                  <br />
                  お聞かせください
                </h2>
                <div className="mt-2.5 flex items-center gap-1.5" aria-hidden>
                  <span className="h-px w-8 bg-[#2f6b4f]/35" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f6b4f]/55" />
                  <span className="h-px w-8 bg-[#2f6b4f]/35" />
                </div>
                <p className="mt-3 w-full text-center text-[11px] leading-[1.75] text-[#4a6858]">
                  MachiGlyphをご利用いただき、ありがとうございます。サービスに関するご意見・ご要望・ご質問など、どんなことでもお気軽にご連絡ください。
                </p>
                <div className="mt-auto w-full pt-5">
                  <div className="flex gap-2.5 rounded-[12px] bg-[#e4f2ea] px-3.5 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f6b4f]/15 text-[#2f6b4f]">
                      <Bell className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1e3828]">
                        管理者からの通知について
                      </p>
                      <p className="mt-0.5 text-[10px] leading-[1.55] text-[#4a6858]">
                        お問い合わせを送信すると、内容確認後、ご登録のメールアドレス宛にご連絡いたします。
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right form */}
              <div className="flex flex-col space-y-3.5 px-7 py-6">
                {formFields("pc")}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="relative mt-1 flex w-full min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full text-[15px] font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(90deg, #2a6348 0%, #3a8260 55%, #4a9470 100%)",
                  }}
                >
                  <Send className="relative z-[1] h-4 w-4" aria-hidden />
                  <span className="relative z-[1]">
                    {submitting ? "送信中…" : "送信する"}
                  </span>
                  <Image
                    src={LEAF_ICON}
                    alt=""
                    width={40}
                    height={40}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-25 brightness-0 invert"
                    aria-hidden
                  />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
