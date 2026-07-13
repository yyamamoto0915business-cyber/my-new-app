"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "join" | "organizer";

const JOIN_FAQS = [
  {
    q: "アカウント登録は必要ですか？",
    a: "閲覧は不要・無料でできます。参加申し込みやボランティア応募にはアカウント登録（無料）が必要です。",
  },
  {
    q: "参加キャンセルはできますか？",
    a: "イベントごとのキャンセルポリシーに従います。各イベント詳細ページのキャンセル条件をご確認ください。",
  },
  {
    q: "支払い方法は何が使えますか？",
    a: "クレジットカード・デビットカードがご利用いただけます（Stripeによる安全な決済）。",
  },
];

const ORG_FAQS = [
  {
    q: "無料で主催できますか？",
    a: "はい、Starterプラン（無料）で毎月1件のイベントを公開できます。継続的に主催したい方にはProプランがおすすめです。",
  },
  {
    q: "参加費を受け取るには？",
    a: "売上受取設定でStripeと連携することで、カード決済での参加費・協賛金の受け取りが可能になります。",
  },
  {
    q: "途中でProにアップグレードできますか？",
    a: "はい、主催者プランページからいつでもアップグレードできます。",
  },
];

function FaqItem({ id, q, a, open, onToggle }: { id: string; q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#f5f3ef] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-[7px] px-0 py-[8px] text-left"
      >
        <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[9px] font-[700] text-[#2B3A6B]">
          Q
        </div>
        <span className="flex-1 text-[12px] font-[500] leading-[1.4]">{q}</span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <p className="pb-[8px] pl-[25px] text-[11px] leading-[1.6] text-[#555]">{a}</p>
      )}
    </div>
  );
}

function TabBar({ activeTab, onSwitch, variant }: { activeTab: Tab; onSwitch: (t: Tab) => void; variant: "pc" | "mobile" }) {
  const isPc = variant === "pc";
  return (
    <div
      className={
        isPc
          ? "hidden min-[900px]:flex items-center border-b border-[#e8e6e0] bg-white px-9 py-[10px] shrink-0"
          : "min-[900px]:hidden px-4 pt-3 pb-2"
      }
    >
      <div className={`flex rounded-xl bg-[#F3F2EF] p-[3px] ${isPc ? "" : "w-full"}`}>
        <button
          type="button"
          onClick={() => onSwitch("join")}
          className={`flex items-center gap-[6px] rounded-[10px] px-6 py-[8px] text-[13px] font-[500] transition-all duration-200 ${isPc ? "" : "flex-1 justify-center text-[11px] px-3 py-[7px]"} ${
            activeTab === "join"
              ? "bg-white text-[#1a1a1a] shadow-[0_1px_6px_rgba(0,0,0,.1)]"
              : "text-[#888]"
          }`}
        >
          {isPc && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}
          {isPc ? "参加・ボランティアとして使う" : "参加・ボランティア"}
        </button>
        <button
          type="button"
          onClick={() => onSwitch("organizer")}
          className={`flex items-center gap-[6px] rounded-[10px] px-6 py-[8px] text-[13px] font-[500] transition-all duration-200 ${isPc ? "" : "flex-1 justify-center text-[11px] px-3 py-[7px]"} ${
            activeTab === "organizer"
              ? "bg-white text-[#1a1a1a] shadow-[0_1px_6px_rgba(0,0,0,.1)]"
              : "text-[#888]"
          }`}
        >
          {isPc && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )}
          イベントを主催する
        </button>
      </div>
      {isPc && (
        <div className="ml-auto flex items-center gap-[3px] text-[12px] text-[#888]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          使い方ガイド
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>("join");
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});

  const toggleFaq = (key: string) => {
    setOpenFaqs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSwitch = (t: Tab) => {
    setActiveTab(t);
    setOpenFaqs({});
  };

  return (
    <div className="flex flex-col min-[900px]:h-[calc(100vh-52px)] min-[900px]:overflow-hidden">
      {/* ── PC tab bar ── */}
      <TabBar activeTab={activeTab} onSwitch={handleSwitch} variant="pc" />

      {/* ── Mobile tab bar ── */}
      <TabBar activeTab={activeTab} onSwitch={handleSwitch} variant="mobile" />

      {/* ══ 参加・ボランティア ══ */}
      {activeTab === "join" && (
        <div className="flex flex-col min-[900px]:flex-row min-[900px]:flex-1 min-[900px]:overflow-hidden">

          {/* 左サイドバー（PCのみ） */}
          <div
            className="hidden min-[900px]:flex min-[900px]:w-[300px] min-[900px]:shrink-0 min-[900px]:flex-col min-[900px]:justify-between min-[900px]:overflow-y-auto p-7"
            style={{ background: "linear-gradient(160deg,#4AADA8 0%,#2a7a76 100%)" }}
          >
            <div className="relative z-10">
              <div className="mb-[6px] text-[9px] font-[600] tracking-[.2em] text-white/80">FOR PARTICIPANTS</div>
              <h1 className="mb-[10px] font-[300] leading-[1.35] text-[24px] text-white" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
                まちのイベントに<br />参加しよう
              </h1>
              <p className="text-[12px] leading-[1.7] text-white/80">
                地域のイベントを探して参加したり、ボランティアとして活動に関わることができます。閲覧は登録不要・無料です。
              </p>
            </div>
            <div className="relative z-10">
              <div className="flex flex-col gap-2">
                <Link
                  href="/events"
                  className="block w-full rounded-[10px] bg-white py-[10px] text-center text-[13px] font-[600] text-[#2a7a76]"
                >
                  イベントを探す →
                </Link>
                <Link
                  href="/volunteer"
                  className="block w-full rounded-[10px] border border-white/35 py-[9px] text-center text-[13px] font-[500] text-white"
                >
                  ボランティア募集を見る →
                </Link>
              </div>
              <p className="mt-4 text-[11px] leading-[1.6] text-white/60">
                アカウント登録は無料。<br />参加申し込み時に必要です。
              </p>
            </div>
          </div>

          {/* 右コンテンツ / モバイル全体 */}
          <div className="relative z-[1] min-[900px]:flex-1 min-[900px]:overflow-y-auto bg-[#F7F6F2] p-4 min-[900px]:p-6 flex flex-col gap-4 pb-24 min-[900px]:pb-6">

            {/* モバイル用ヒーロー */}
            <div
              className="min-[900px]:hidden rounded-xl p-4 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#4AADA8 0%,#2a7a76 100%)" }}
            >
              <div className="relative z-10">
                <div className="mb-[3px] text-[8px] font-[600] tracking-[.14em] text-white/80">FOR PARTICIPANTS</div>
                <h1 className="mb-[5px] text-[18px] font-[300] leading-[1.3] text-white" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
                  まちのイベントに<br />参加しよう
                </h1>
                <p className="mb-3 text-[11px] leading-[1.5] text-white/80">
                  地域のイベントを探して参加したり、ボランティアとして活動に関わることができます。閲覧は登録不要・無料です。
                </p>
                <div className="flex gap-[7px]">
                  <Link href="/events" className="flex-1 rounded-[9px] bg-white py-[9px] text-center text-[12px] font-[600] text-[#2a7a76]">
                    イベントを探す →
                  </Link>
                  <Link href="/volunteer" className="flex-1 rounded-[9px] border border-white/35 py-[8px] text-center text-[12px] font-[500] text-white">
                    ボランティアを見る →
                  </Link>
                </div>
              </div>
            </div>

            {/* ステップフロー */}
            <div>
              <div className="mb-[10px] text-[11px] font-[600] tracking-[.08em] text-[#888]">参加するまでの流れ</div>
              <div className="grid grid-cols-3 overflow-hidden rounded-[14px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff]">
                {[
                  { n: 1, title: "イベントを探す", desc: "地域名・キーワードで検索。開催日・エリア・参加費で絞り込みが可能です。" },
                  { n: 2, title: "アカウントを登録（無料）", desc: "参加申し込みにはアカウントが必要です。メールアドレスで簡単に登録できます。" },
                  { n: 3, title: "参加申し込みをする", desc: "「参加する」ボタンで申し込み完了。参加費ありの場合はカード決済できます。" },
                ].map(({ n, title, desc }, i) => (
                  <div key={n} className="relative border-r border-[#e8e6e0] last:border-r-0 p-[16px] min-[900px]:p-[18px]">
                    {i < 2 && (
                      <span className="absolute right-[-11px] top-1/2 z-[2] -translate-y-1/2 text-[14px] font-[300] text-[#e8e6e0]">→</span>
                    )}
                    <div className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4AADA8] text-[9px] font-[700] text-white">
                      {n}
                    </div>
                    <div className="mb-1 text-[13px] font-[500]">{title}</div>
                    <div className="text-[11px] leading-[1.6] text-[#888]">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 下部2列 */}
            <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-[14px]">

              {/* ボランティアポイント */}
              <div className="rounded-[12px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff] p-[14px] min-[900px]:p-[16px]">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.06em] text-[#888]">VOLUNTEER について</div>
                {[
                  { color: "#E8855A", text: <><strong>役割ごとに募集がある：</strong>受付・誘導・設営など自分に合ったポジションを選んで応募できます。</> },
                  { color: "#4AADA8", text: <><strong>主催者とメッセージ：</strong>応募後は受信箱で直接やりとりができます。</> },
                  { color: "#6BBF3E", text: <><strong>承認制で安心：</strong>応募後は主催者の承認で確定。条件を確認してから参加できます。</> },
                  { color: "#2B3A6B", text: <><strong>基本無料：</strong>ボランティア参加は基本無料。報酬等の条件は各募集ページをご確認ください。</> },
                ].map(({ color, text }, i) => (
                  <div key={i} className="mb-2 flex items-start gap-[9px] last:mb-0">
                    <div className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: color }} />
                    <div className="text-[12px] leading-[1.6]">{text}</div>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div className="rounded-[12px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff] p-[14px] min-[900px]:p-[16px]">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.06em] text-[#888]">よくある質問</div>
                {JOIN_FAQS.map((faq, i) => (
                  <FaqItem
                    key={i}
                    id={`join-${i}`}
                    q={faq.q}
                    a={faq.a}
                    open={!!openFaqs[`join-${i}`]}
                    onToggle={() => toggleFaq(`join-${i}`)}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══ 主催者向け ══ */}
      {activeTab === "organizer" && (
        <div className="flex flex-col min-[900px]:flex-row min-[900px]:flex-1 min-[900px]:overflow-hidden">

          {/* 左サイドバー（PCのみ） */}
          <div
            className="hidden min-[900px]:flex min-[900px]:w-[280px] min-[900px]:shrink-0 min-[900px]:flex-col min-[900px]:overflow-y-auto p-5 gap-0"
            style={{ background: "linear-gradient(180deg,#2B3A6B 0%,#1a2550 100%)" }}
          >
            <div className="mb-5">
              <div className="mb-[5px] text-[9px] font-[600] tracking-[.2em] text-[#c8a84b]/85">FOR ORGANIZERS</div>
              <h1 className="mb-2 text-[20px] font-[300] leading-[1.35] text-white" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
                イベントを<br />主催しよう
              </h1>
              <p className="mb-4 text-[11px] leading-[1.7] text-white/75">
                MachiGlyphでイベントを公開し、スタッフを募集して運営できます。
              </p>
            </div>

            {/* プラン比較テーブル */}
            <div className="mb-2 text-[10px] tracking-[.08em] text-white/60">プラン比較</div>
            <table className="w-full border-collapse overflow-hidden rounded-[10px] text-left">
              <thead>
                <tr>
                  <th className="bg-white/10 p-[7px] text-[10px] text-white/70 text-left" />
                  <th className="bg-white/10 p-[7px] text-[10px] text-white/70 text-center">
                    Starter<br /><span className="text-[9px] opacity-70">無料</span>
                  </th>
                  <th className="bg-white/10 p-[7px] text-[10px] text-[#f5e07a] text-center">
                    Pro<br /><span className="text-[9px]">月額980円</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["月の公開枠", "1件", "無制限"],
                  ["スタッフ募集", "✓", "✓"],
                  ["チャット", "✓", "✓"],
                  ["売上受取", "別途設定", "別途設定"],
                  ["協賛受付", "✓", "✓"],
                ].map(([label, starter, pro]) => (
                  <tr key={label} className="border-b border-white/7 last:border-b-0">
                    <td className="p-[7px] text-[11px] text-white">{label}</td>
                    <td className="p-[7px] text-[11px] text-white/80 text-center">{starter}</td>
                    <td className="p-[7px] text-[11px] text-[#f5e07a] font-[500] text-center">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-[6px]">
              <Link
                href="/auth?tab=signup"
                className="block w-full rounded-[10px] bg-[#c8a84b] py-[10px] text-center text-[13px] font-[600] text-[#0A0D18]"
              >
                主催者として登録する →
              </Link>
              <Link
                href="/login"
                className="block w-full rounded-[10px] border border-white/30 py-[9px] text-center text-[12px] font-[500] text-white"
              >
                ログインして主催者管理へ
              </Link>
            </div>
          </div>

          {/* 右コンテンツ / モバイル全体 */}
          <div className="relative z-[1] min-[900px]:flex-1 min-[900px]:overflow-y-auto bg-[#F7F6F2] p-4 min-[900px]:p-6 flex flex-col gap-4 pb-24 min-[900px]:pb-6">

            {/* モバイル用ヒーロー */}
            <div
              className="min-[900px]:hidden rounded-xl p-4 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#2B3A6B 0%,#1a2550 100%)" }}
            >
              <div className="relative z-10">
                <div className="mb-[3px] text-[8px] font-[600] tracking-[.14em] text-[#c8a84b]/85">FOR ORGANIZERS</div>
                <h1 className="mb-[5px] text-[18px] font-[300] leading-[1.3] text-white" style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}>
                  イベントを主催しよう
                </h1>
                <p className="mb-3 text-[11px] leading-[1.5] text-white/80">
                  MachiGlyphでイベントを公開し、スタッフを募集して運営できます。Starterプランは無料です。
                </p>
                <div className="flex gap-[7px]">
                  <Link href="/auth?tab=signup" className="flex-1 rounded-[9px] bg-[#c8a84b] py-[9px] text-center text-[12px] font-[600] text-[#0A0D18]">
                    主催者として登録 →
                  </Link>
                  <Link href="/login" className="flex-1 rounded-[9px] border border-white/35 py-[8px] text-center text-[12px] font-[500] text-white">
                    ログインして始める
                  </Link>
                </div>
              </div>
            </div>

            {/* ステップフロー */}
            <div>
              <div className="mb-[10px] text-[11px] font-[600] tracking-[.08em] text-[#888]">主催するまでの流れ</div>

              {/* PC: 4列横並び */}
              <div className="hidden min-[900px]:grid grid-cols-4 overflow-hidden rounded-[14px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff]">
                {[
                  { n: 1, bg: "#2B3A6B", title: "アカウント登録・プロフィール設定", desc: "無料で登録。団体名・問い合わせ先を設定して主催者として始めます。" },
                  { n: 2, bg: "#2B3A6B", title: "プランを確認する", desc: "Starterプラン（無料）またはProプラン（月額980円・無制限）を選択します。" },
                  { n: 3, bg: "#6BBF3E", title: "イベントを作成・公開する", desc: "タイトル・日時・場所・参加費・定員を入力して公開。参加費ありはStripe設定が先に必要です。" },
                  { n: 4, bg: "#c8a84b", title: "スタッフを募集する（任意）", desc: "受付・誘導・設営など役割ごとに募集を作成。応募・承認もアプリ内で完結します。" },
                ].map(({ n, bg, title, desc }, i) => (
                  <div key={n} className="relative border-r border-[#e8e6e0] last:border-r-0 p-[18px]">
                    {i < 3 && (
                      <span className="absolute right-[-11px] top-1/2 z-[2] -translate-y-1/2 text-[14px] font-[300] text-[#e8e6e0]">→</span>
                    )}
                    <div className="mb-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-[700] text-white" style={{ background: bg }}>
                      {n}
                    </div>
                    <div className="mb-1 text-[13px] font-[500]">{title}</div>
                    <div className="text-[11px] leading-[1.6] text-[#888]">{desc}</div>
                  </div>
                ))}
              </div>

              {/* Mobile: 2×2 grid */}
              <div className="min-[900px]:hidden overflow-hidden rounded-[12px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff]">
                <div className="text-[10px] font-[600] tracking-[.08em] text-[#888] px-[14px] pt-[10px] pb-[6px]">主催するまでの流れ</div>
                <div className="grid grid-cols-2 border-t border-[#e8e6e0]">
                  {[
                    { n: 1, bg: "#2B3A6B", title: "アカウント登録・プロフィール設定", desc: "無料で登録" },
                    { n: 2, bg: "#2B3A6B", title: "プランを確認", desc: "Starter無料／Pro 980円" },
                  ].map(({ n, bg, title, desc }) => (
                    <div key={n} className="border-r border-[#e8e6e0] last:border-r-0 p-[10px] text-center">
                      <div className="mx-auto mb-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full text-[8px] font-[700] text-white" style={{ background: bg }}>
                        {n}
                      </div>
                      <div className="text-[10px] font-[500] leading-[1.3]">{title}</div>
                      <div className="mt-[3px] text-[9px] leading-[1.4] text-[#888]">{desc}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 border-t border-[#e8e6e0]">
                  {[
                    { n: 3, bg: "#6BBF3E", title: "イベントを作成・公開", desc: "有料はStripe設定が先" },
                    { n: 4, bg: "#c8a84b", title: "スタッフ募集（任意）", desc: "役割ごとに作成可能" },
                  ].map(({ n, bg, title, desc }) => (
                    <div key={n} className="border-r border-[#e8e6e0] last:border-r-0 p-[10px] text-center">
                      <div className="mx-auto mb-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full text-[8px] font-[700] text-white" style={{ background: bg }}>
                        {n}
                      </div>
                      <div className="text-[10px] font-[500] leading-[1.3]">{title}</div>
                      <div className="mt-[3px] text-[9px] leading-[1.4] text-[#888]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* モバイル用プラン比較 */}
            <div className="min-[900px]:hidden">
              <div className="mb-[6px] text-[10px] font-[600] tracking-[.08em] text-[#888]">プラン比較</div>
              <div className="overflow-hidden rounded-[10px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff]">
                <div className="flex items-center border-b border-[#f5f3ef] bg-[#fafaf8] px-3 py-2">
                  <div className="flex-[2] text-[11px] text-[#1a1a1a]" />
                  <div className="flex-1 text-center text-[11px] text-[#888]">Starter<br /><span className="text-[9px]">無料</span></div>
                  <div className="flex-1 text-center text-[11px] font-[500] text-[#2B3A6B]">Pro<br /><span className="text-[9px]">月額980円</span></div>
                </div>
                {[
                  ["月の公開枠", "1件", "無制限"],
                  ["スタッフ募集", "✓", "✓"],
                  ["売上受取（Stripe）", "別途設定", "別途設定"],
                  ["協賛受付", "✓", "✓"],
                ].map(([label, starter, pro]) => (
                  <div key={label} className="flex items-center border-b border-[#f5f3ef] px-3 py-2 last:border-b-0">
                    <div className="flex-[2] text-[11px] text-[#1a1a1a]">{label}</div>
                    <div className="flex-1 text-center text-[11px] text-[#888]">{starter}</div>
                    <div className="flex-1 text-center text-[11px] font-[500] text-[#2B3A6B]">{pro}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 下部2列 */}
            <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-[14px]">

              {/* 主催者向けポイント */}
              <div className="rounded-[12px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff] p-[14px] min-[900px]:p-[16px]">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.06em] text-[#888]">主催者向けポイント</div>
                {[
                  { color: "#2B3A6B", text: <><strong>Starterは無料：</strong>まずは無料で始められます。月1件のイベントを公開できます。</> },
                  { color: "#6BBF3E", text: <><strong>参加費ありのイベントは：</strong>事前に売上受取設定（Stripe連携）が必要です。プランとは別の設定です。</> },
                  { color: "#c8a84b", text: <><strong>先着特典あり：</strong>早期登録の主催者には追加の公開枠特典が適用されます。</> },
                  { color: "#E8708A", text: <><strong>公開後も編集可能：</strong>イベント公開後もイベント管理ページから内容を変更できます。</> },
                ].map(({ color, text }, i) => (
                  <div key={i} className="mb-2 flex items-start gap-[9px] last:mb-0">
                    <div className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: color }} />
                    <div className="text-[12px] leading-[1.6]">{text}</div>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div className="rounded-[12px] relative z-[1] border border-[#e8e6e0] bg-[#ffffff] p-[14px] min-[900px]:p-[16px]">
                <div className="mb-[10px] text-[12px] font-[600] tracking-[.06em] text-[#888]">よくある質問</div>
                {ORG_FAQS.map((faq, i) => (
                  <FaqItem
                    key={i}
                    id={`org-${i}`}
                    q={faq.q}
                    a={faq.a}
                    open={!!openFaqs[`org-${i}`]}
                    onToggle={() => toggleFaq(`org-${i}`)}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
