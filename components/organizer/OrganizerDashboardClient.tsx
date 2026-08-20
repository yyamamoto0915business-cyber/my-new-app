"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import type {
  DashboardKpis,
  DashboardEvent,
  BillingSummary,
} from "@/app/api/organizer/dashboard/route";
import type { PlanSummary } from "@/lib/organizer-plan-summary";
import { OrganizerManagementHeroBanner } from "@/components/organizer/OrganizerManagementHeroBanner";
import { OrganizerCreateSplitButton } from "@/components/organizer/OrganizerCreateSplitButton";
import {
  OrganizerHeroBleed,
  OrganizerPageShell,
  organizerHeroDenseSkeletonClass,
} from "@/components/organizer/OrganizerPageShell";

const RECENT_LIMIT = 3;

// ── MachiGlyph ロゴ SVG ────────────────────────────────────────────────────────
function PlanLogo({ isPro, size = 30 }: { isPro: boolean; size?: number }) {
  const lines = isPro
    ? ["#f0d060", "#f0d060", "#f0d060", "#C0C8D8", "#C0C8D8", "#C0C8D8"]
    : ["#6BBF3E", "#6BBF3E", "#6BBF3E", "#fff", "#fff", "#fff"];
  const nodes = isPro
    ? ["#f5e07a", "#f5e07a", "#f5e07a", "#E8EEFF", "#E8EEFF", "#E8EEFF"]
    : ["#6BBF3E", "#6BBF3E", "#6BBF3E", "#fff", "#fff", "#fff"];
  const center = isPro ? "#C0C8D8" : "#fff";
  const dot = isPro ? "#f0d060" : "#6BBF3E";
  const hex = isPro ? "rgba(200,168,75,0.35)" : "rgba(255,255,255,0.3)";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <polygon points="50,5 88,27 88,73 50,95 12,73 12,27" fill="none" stroke={hex} strokeWidth="3"/>
      <line x1="50" y1="5"  x2="50" y2="50" stroke={lines[0]} strokeWidth="6" strokeLinecap="round"/>
      <line x1="12" y1="73" x2="50" y2="50" stroke={lines[1]} strokeWidth="6" strokeLinecap="round"/>
      <line x1="88" y1="73" x2="50" y2="50" stroke={lines[2]} strokeWidth="6" strokeLinecap="round"/>
      <line x1="12" y1="27" x2="50" y2="50" stroke={lines[3]} strokeWidth="6" strokeLinecap="round"/>
      <line x1="88" y1="27" x2="50" y2="50" stroke={lines[4]} strokeWidth="6" strokeLinecap="round"/>
      <line x1="50" y1="95" x2="50" y2="50" stroke={lines[5]} strokeWidth="6" strokeLinecap="round"/>
      <circle cx="50" cy="5"  r="8" fill={nodes[0]} stroke={hex} strokeWidth="2"/>
      <circle cx="12" cy="73" r="8" fill={nodes[1]} stroke={hex} strokeWidth="2"/>
      <circle cx="88" cy="73" r="8" fill={nodes[2]} stroke={hex} strokeWidth="2"/>
      <circle cx="12" cy="27" r="8" fill={nodes[3]} stroke={hex} strokeWidth="2"/>
      <circle cx="88" cy="27" r="8" fill={nodes[4]} stroke={hex} strokeWidth="2"/>
      <circle cx="50" cy="95" r="8" fill={nodes[5]} stroke={hex} strokeWidth="2"/>
      <circle cx="50" cy="50" r="12" fill={center}/>
      <circle cx="50" cy="50" r="6"  fill={dot} opacity="0.85"/>
      <circle cx="50" cy="50" r="2.5" fill={dot}/>
    </svg>
  );
}


// ── プランカード ───────────────────────────────────────────────────────────────
function PlanCard({
  planSummary,
  onChangePlan,
  compact = false,
}: {
  planSummary: PlanSummary;
  onChangePlan: () => void;
  compact?: boolean;
}) {
  const isPro = !planSummary.isFreePlan;

  const starterMeta = planSummary.publishLimit !== null
    ? `公開枠 ${planSummary.publishLimit}件/月`
    : "公開枠 無制限";

  const pad = compact ? "11px 12px" : "16px 18px";
  const logoSize = compact ? 38 : 46;
  const planTitleSize = compact ? "17px" : "20px";

  return (
    <div className={`org-plan-card-glow-wrap${isPro ? " is-pro" : ""}`}>
      <div
        className={isPro ? "org-plan-card-pro" : ""}
        style={{
          borderRadius: compact ? "12px" : "16px",
          padding: pad,
          display: "flex",
          alignItems: "center",
          gap: compact ? "10px" : "14px",
          position: "relative",
          overflow: "hidden",
          // background-colorをinline styleで確実に設定
          // org-plan-card-pro クラスのbackground-imageが上に重なる
          backgroundColor: isPro ? "#0A0D18" : "#2B3A6B",
        }}
      >
        {/* 装飾円 */}
        <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "110px", height: "110px", borderRadius: "50%", background: isPro ? "rgba(200,168,75,0.08)" : "rgba(255,255,255,0.06)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: "-32px", left: "30px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }}/>

        {/* PROバッジ */}
        {isPro && (
          <div style={{
            position: "absolute", top: 0, right: 0,
            fontSize: "9px", fontWeight: 800,
            padding: "4px 14px", letterSpacing: "0.12em",
            borderRadius: "0 14px 0 12px",
            background: "linear-gradient(90deg, #c8a84b, #f0d060, #c8a84b)",
            backgroundSize: "200% auto",
            animation: "org-badge-shimmer 1.8s linear infinite, org-badge-glow 2.2s ease-in-out infinite",
            color: "#0A0D18",
          }}>
            PRO
          </div>
        )}

        {/* ロゴ */}
        <div style={{
          width: logoSize, height: logoSize, borderRadius: compact ? "10px" : "13px",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          background: isPro ? "rgba(200,168,75,0.15)" : "rgba(255,255,255,0.15)",
          border: isPro ? "1px solid rgba(200,168,75,0.4)" : "none",
        }}>
          <PlanLogo isPro={isPro} size={compact ? 24 : 30}/>
        </div>

        {/* テキスト */}
        <div style={{ flex: 1, zIndex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", color: isPro ? "#c8a84b" : "rgba(255,255,255,0.6)" }}>
            現在のプラン
          </div>
          <div style={{ fontSize: planTitleSize, fontWeight: 700, color: "#fff", marginTop: "1px", letterSpacing: "0.01em", lineHeight: 1.2 }}>
            {isPro ? "Pro" : "Starter"}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            marginTop: compact ? "4px" : "6px", padding: "2px 8px", borderRadius: "20px",
            fontSize: "9px",
            background: isPro ? "rgba(200,168,75,0.12)" : "rgba(255,255,255,0.14)",
            color: isPro ? "#e8c96a" : "rgba(255,255,255,0.85)",
            border: isPro ? "0.5px solid rgba(200,168,75,0.4)" : "none",
          }}>
            {isPro ? "公開枠 無制限" : starterMeta}
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: "flex", flexDirection: compact ? "row" : "column", gap: compact ? "5px" : "6px", flexShrink: 0, zIndex: 1 }}>
          <button
            type="button"
            onClick={onChangePlan}
            style={{
              borderRadius: "10px", padding: compact ? "6px 10px" : "7px 13px",
              fontSize: "10px", fontWeight: 700,
              border: "none", fontFamily: "inherit", cursor: "pointer",
              background: isPro
                ? "linear-gradient(90deg, #c8a84b, #f0d060, #c8a84b)"
                : "#c8a84b",
              backgroundSize: isPro ? "200% auto" : "auto",
              animation: isPro ? "org-badge-shimmer 2s linear infinite" : "none",
              color: isPro ? "#0D1020" : "#1A3A2A",
            }}
          >
            {isPro ? "プランを変更" : "Proにアップグレード"}
          </button>
          <Link
            href="/organizer/settings/plan"
            style={{
              borderRadius: "10px", padding: compact ? "6px 10px" : "7px 13px",
              fontSize: "10px", fontWeight: 700,
              background: "rgba(255,255,255,0.12)", color: "#fff",
              textAlign: "center", whiteSpace: "nowrap", textDecoration: "none",
            }}
          >
            {compact ? "詳細" : "詳細を見る"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── プラン変更モーダル ─────────────────────────────────────────────────────────
function PlanModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<"starter" | "pro">("starter");

  const starterBorder = selected === "starter" ? "2px solid #2B3A6B" : "2px solid #e8e6e0";
  const starterBg = selected === "starter" ? "#f0f4ff" : "#fff";
  const proBorder = selected === "pro" ? "2px solid #c8a84b" : "2px solid #e8e6e0";
  const proBg = selected === "pro" ? "#fffbf0" : "#fff";
  const confirmBg = selected === "pro" ? "#c8a84b" : "#2B3A6B";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 36px",
          width: "100%",
          maxWidth: "480px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "#1a1a1a" }}>プランを選択</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F3F2EF", border: "none",
              width: "30px", height: "30px", borderRadius: "50%",
              fontSize: "16px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Starterカード */}
        <div
          onClick={() => setSelected("starter")}
          style={{
            borderRadius: "12px", border: starterBorder,
            padding: "14px 16px", marginBottom: "10px",
            cursor: "pointer", transition: "all 0.2s",
            background: starterBg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PlanLogo isPro={false} size={22}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a1a" }}>
                Starter <span style={{ fontSize: "11px", fontWeight: 400, color: "#999" }}>無料</span>
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>公開枠 1件/月</div>
            </div>
            <div style={{
              width: "22px", height: "22px", borderRadius: "50%",
              border: selected === "starter" ? "2px solid #2B3A6B" : "2px solid #ddd",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: selected === "starter" ? "#2B3A6B" : "transparent",
            }}>
              {selected === "starter" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Proカード */}
        <div
          onClick={() => setSelected("pro")}
          style={{
            borderRadius: "12px", border: proBorder,
            padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
            background: proBg, position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, background: "#c8a84b", color: "#0A0D18", fontSize: "9px", fontWeight: 700, padding: "3px 12px", borderRadius: "0 10px 0 10px", letterSpacing: "0.08em" }}>おすすめ</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(200,168,75,0.15)", border: "1px solid rgba(200,168,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PlanLogo isPro={true} size={22}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a1a" }}>
                Pro <span style={{ fontSize: "11px", fontWeight: 400, color: "#999" }}>有料</span>
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>公開枠 無制限・優先サポート</div>
            </div>
            <div style={{
              width: "22px", height: "22px", borderRadius: "50%",
              border: selected === "pro" ? "2px solid #c8a84b" : "2px solid #ddd",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: selected === "pro" ? "#c8a84b" : "transparent",
            }}>
              {selected === "pro" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/organizer/settings/plan"
          style={{
            marginTop: "16px", display: "block", width: "100%",
            background: confirmBg, color: "#fff",
            border: "none", borderRadius: "12px",
            padding: "14px", fontSize: "14px", fontWeight: 500,
            fontFamily: "inherit", cursor: "pointer",
            textAlign: "center", textDecoration: "none",
            transition: "background 0.2s",
          }}
        >
          このプランに変更する
        </Link>
      </div>
    </div>
  );
}

// ── フォーマット ──────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    const month = d.toLocaleDateString("ja-JP", { month: "short" });
    const day = d.getDate();
    return { day: String(day), month };
  } catch {
    return { day: dateStr, month: "" };
  }
}

// ── メインダッシュボード ──────────────────────────────────────────────────────
export default function OrganizerDashboardClient() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    hosting: 0,
    needsAction: 0,
    pendingApplications: 0,
    unreadMessages: 0,
    recruitingPublic: 0,
  });
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/organizer/dashboard", { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setKpis(data.kpis ?? kpis);
        setEvents(data.events ?? []);
        setBillingSummary(data.billingSummary ?? null);
        setPlanSummary(data.planSummary ?? null);
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setKpis({ hosting: 0, needsAction: 0, pendingApplications: 0, unreadMessages: 0, recruitingPublic: 0 });
        setEvents([]);
        setBillingSummary(null);
        setPlanSummary(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPro = planSummary ? !planSummary.isFreePlan : false;

  const recentEvents = useMemo(() => [...events].slice(0, RECENT_LIMIT), [events]);
  const draftCount = useMemo(() => events.filter((e) => e.status === "draft").length, [events]);
  /** ダッシュボード取得後のみ。未設定なら参加費・協賛の受取に Stripe 連携が必要 */
  const payoutSetupIncomplete =
    billingSummary != null && billingSummary.paymentSetupStatus !== "ok";
  const showFirstPublishHint = kpis.hosting === 0;

  const insightItems: { key: string; node: ReactNode }[] = [];
  if (!isPro) {
    insightItems.push({
      key: "pro",
      node: (
        <button
          type="button"
          onClick={() => setShowPlanModal(true)}
          className="flex w-full items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-left shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-opacity active:opacity-85 min-[900px]:gap-3 min-[900px]:rounded-[12px] min-[900px]:px-3.5 min-[900px]:py-3"
          style={{ border: "0.5px solid #e8e6e0" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full min-[900px]:h-2 min-[900px]:w-2" style={{ background: "#E8853A" }} />
          <span className="min-w-0 flex-1 text-[11px] leading-snug min-[900px]:text-[12px]" style={{ color: "#333" }}>
            Proで公開枠が無制限になります
          </span>
          <span className="shrink-0 text-[#bbb]" aria-hidden>›</span>
        </button>
      ),
    });
  }
  if (payoutSetupIncomplete) {
    insightItems.push({
      key: "payout",
      node: (
        <Link
          href="/organizer/settings/payouts"
          className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-opacity active:opacity-85 min-[900px]:gap-3 min-[900px]:rounded-[12px] min-[900px]:px-3.5 min-[900px]:py-3"
          style={{ border: "0.5px solid #e8e6e0" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full min-[900px]:h-2 min-[900px]:w-2" style={{ background: "#E8708A" }} />
          <span className="min-w-0 flex-1 text-[11px] font-medium leading-snug min-[900px]:text-[12px]" style={{ color: "#333" }}>
            Stripeの売上受取設定が未完了です
          </span>
          <span className="shrink-0 text-[#bbb]" aria-hidden>›</span>
        </Link>
      ),
    });
  }
  if (showFirstPublishHint) {
    insightItems.push({
      key: "first",
      node: (
        <Link
          href="/organizer/events/new"
          className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-opacity active:opacity-85 min-[900px]:gap-3 min-[900px]:rounded-[12px] min-[900px]:px-3.5 min-[900px]:py-3"
          style={{ border: "0.5px solid #e8e6e0" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full min-[900px]:h-2 min-[900px]:w-2" style={{ background: "#6BBF3E" }} />
          <span className="min-w-0 flex-1 text-[11px] leading-snug min-[900px]:text-[12px]" style={{ color: "#333" }}>
            最初のイベントを作成して公開しましょう
          </span>
          <span className="shrink-0 text-[#bbb]" aria-hidden>›</span>
        </Link>
      ),
    });
  }

  if (loading) {
    return (
      <OrganizerPageShell variant="hero" contentClassName="space-y-2 min-[900px]:space-y-2.5">
        <OrganizerHeroBleed>
          <div className={organizerHeroDenseSkeletonClass} />
        </OrganizerHeroBleed>
        <div className="mx-auto w-full max-w-2xl min-[900px]:max-w-5xl space-y-2 pt-1 min-[900px]:space-y-3">
          <div className="h-[72px] animate-pulse rounded-[12px] bg-[#d8e4e0] min-[900px]:h-[90px] min-[900px]:rounded-[16px]" />
          <div className="grid grid-cols-2 gap-1.5 min-[900px]:grid-cols-4 min-[900px]:gap-2">
            <div className="h-[52px] animate-pulse rounded-[10px] bg-[#d8e4e0] min-[900px]:h-[68px]" />
            <div className="h-[52px] animate-pulse rounded-[10px] bg-[#d8e4e0] min-[900px]:h-[68px]" />
            <div className="h-[52px] animate-pulse rounded-[10px] bg-[#d8e4e0] min-[900px]:h-[68px]" />
            <div className="h-[52px] animate-pulse rounded-[10px] bg-[#d8e4e0] min-[900px]:h-[68px]" />
          </div>
        </div>
      </OrganizerPageShell>
    );
  }

  return (
    <OrganizerPageShell variant="hero" contentClassName="space-y-2 pb-16 sm:pb-8 min-[900px]:space-y-2.5 min-[900px]:pb-8">
      <OrganizerHeroBleed>
        <OrganizerManagementHeroBanner
          compact
          dense
          labelEn="ORGANIZER"
          titleJa="主催者ダッシュボード"
          subtitleJa="― ダッシュボード ―"
        />
      </OrganizerHeroBleed>

      <div className="mx-auto w-full max-w-2xl min-[900px]:max-w-5xl space-y-2 pt-2 min-[900px]:space-y-3 min-[900px]:pt-3">
        {/* プランカード */}
        {planSummary && (
          <PlanCard
            planSummary={planSummary}
            onChangePlan={() => setShowPlanModal(true)}
            compact
          />
        )}

        {/* 注目・未完了（モバイルは1ブロックにまとめる） */}
        {insightItems.length > 0 && (
          <div className={insightItems.length > 1 ? "space-y-1.5 min-[900px]:space-y-2" : ""}>
            {insightItems.map((item) => (
              <div key={item.key}>{item.node}</div>
            ))}
          </div>
        )}

        {/* KPI + イベント作成（モバイルは1行に統合） */}
        <div className="grid grid-cols-2 gap-1.5 min-[900px]:grid-cols-4 min-[900px]:gap-2">
          <div
            className="rounded-[10px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-[900px]:px-3.5 min-[900px]:py-3"
            style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}
          >
            <div className="text-[16px] font-semibold leading-none min-[900px]:text-[22px]" style={{ color: "#2B3A6B" }}>{kpis.hosting}</div>
            <div className="mt-0.5 text-[9px] leading-tight min-[900px]:mt-1 min-[900px]:text-[10px]" style={{ color: "#999" }}>
              <span className="min-[900px]:hidden">公開中</span>
              <span className="hidden min-[900px]:inline">公開中イベント</span>
            </div>
          </div>
          <div
            className="rounded-[10px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-[900px]:px-3.5 min-[900px]:py-3"
            style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}
          >
            <div className="text-[16px] font-semibold leading-none min-[900px]:text-[22px]" style={{ color: "#b0b0b0" }}>{draftCount}</div>
            <div className="mt-0.5 text-[9px] min-[900px]:mt-1 min-[900px]:text-[10px]" style={{ color: "#999" }}>下書き</div>
          </div>
          <div
            className="rounded-[10px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-[900px]:px-3.5 min-[900px]:py-3"
            style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}
          >
            <div className="text-[16px] font-semibold leading-none min-[900px]:text-[22px]" style={{ color: "#b0b0b0" }}>{kpis.recruitingPublic}</div>
            <div className="mt-0.5 text-[9px] leading-tight min-[900px]:mt-1 min-[900px]:text-[10px]" style={{ color: "#999" }}>
              ボランティア募集中
            </div>
          </div>
          <Link
            href="/organizer/inbox"
            className="block rounded-[10px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-opacity active:opacity-85 min-[900px]:px-3.5 min-[900px]:py-3"
            style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}
          >
            <div className="text-[16px] font-semibold leading-none min-[900px]:text-[22px]" style={{ color: "#E8708A" }}>{kpis.unreadMessages}</div>
            <div className="mt-0.5 text-[9px] leading-tight min-[900px]:mt-1 min-[900px]:text-[10px]" style={{ color: "#999" }}>
              受信箱 未読
            </div>
          </Link>
        </div>

        <OrganizerCreateSplitButton />

        <div className="grid gap-2 min-[900px]:grid-cols-2 min-[900px]:gap-4 min-[900px]:items-stretch">
        {/* 最近のイベント */}
        <div className="overflow-hidden rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-col min-[900px]:rounded-[12px]" style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}>
          <div className="flex items-center justify-between px-3 py-2 min-[900px]:px-3.5 min-[900px]:py-2.5" style={{ borderBottom: "0.5px solid #e8e6e0" }}>
            <div className="text-[11px] font-medium" style={{ color: "#1a1a1a" }}>最近のイベント</div>
            <Link href="/organizer/events" className="text-[10px]" style={{ color: "#2B3A6B", opacity: 0.7 }}>すべて見る →</Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="px-3 py-5 text-center min-[900px]:px-3.5 min-[900px]:py-8">
              <div className="text-[11px] min-[900px]:text-[12px]" style={{ color: "#bbb" }}>イベントはまだありません</div>
              <Link
                href="/organizer/events/new"
                className="mt-2 inline-block rounded-[10px] px-3.5 py-1.5 text-[11px] font-medium text-white min-[900px]:mt-3 min-[900px]:px-4 min-[900px]:py-2"
                style={{ background: "#6BBF3E" }}
              >
                作成する
              </Link>
            </div>
          ) : (
            <div>
              {recentEvents.map((event, i) => {
                const { day, month } = formatDate(event.date ?? "");
                const isLast = i === recentEvents.length - 1;
                return (
                  <Link
                    key={event.id}
                    href={`/organizer/events/${event.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 transition-opacity active:opacity-80 min-[900px]:gap-3 min-[900px]:px-3.5 min-[900px]:py-2.5"
                    style={{
                      borderBottom: isLast ? "none" : "0.5px solid #e8e6e0",
                    }}
                  >
                    <div
                      className="flex h-[30px] w-[30px] shrink-0 flex-col items-center justify-center rounded-[6px] min-[900px]:h-[34px] min-[900px]:w-[34px] min-[900px]:rounded-[7px]"
                      style={{ background: "#EEF4FB" }}
                    >
                      <span className="text-[13px] font-medium leading-none min-[900px]:text-[14px]" style={{ color: "#2B3A6B" }}>{day}</span>
                      <span className="text-[7px]" style={{ color: "#2B3A6B", opacity: 0.6 }}>{month}</span>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: "#1a1a1a" }}>
                      {event.title}
                    </span>
                    <span
                      className="shrink-0 rounded-[8px] px-1.5 py-0.5 text-[9px] min-[900px]:rounded-[10px] min-[900px]:px-2"
                      style={
                        event.status === "public"
                          ? { background: "#EAF6DE", color: "#3a7a10" }
                          : { background: "#F3F2EF", color: "#888" }
                      }
                    >
                      {event.status === "public" ? "公開中" : event.status === "draft" ? "下書き" : "終了"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ボランティア募集 */}
        <div className="overflow-hidden rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] min-[900px]:mt-0 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-col min-[900px]:rounded-[12px]" style={{ background: "#fff", border: "0.5px solid #e8e6e0" }}>
          <div className="flex items-center justify-between px-3 py-2 min-[900px]:px-3.5 min-[900px]:py-2.5" style={{ borderBottom: "0.5px solid #e8e6e0" }}>
            <div className="text-[11px] font-medium" style={{ color: "#1a1a1a" }}>ボランティア募集</div>
            <Link href="/organizer/recruitments" className="text-[10px]" style={{ color: "#2B3A6B", opacity: 0.7 }}>すべて見る →</Link>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:justify-center min-[900px]:px-3.5 min-[900px]:py-4 min-[900px]:text-center">
            <p className="text-[11px]" style={{ color: "#bbb" }}>募集中の活動はありません</p>
            <Link
              href="/organizer/recruitments/new"
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium transition-colors min-[900px]:hidden"
              style={{ color: "#6BBF3E" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6BBF3E" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              募集を作成
            </Link>
          </div>
          <Link
            href="/organizer/recruitments/new"
            className="hidden items-center justify-center gap-1.5 px-3.5 py-2.5 text-[11px] font-medium transition-colors min-[900px]:flex"
            style={{ borderTop: "0.5px solid #e8e6e0", color: "#6BBF3E" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6BBF3E" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            スタッフ募集を作成
          </Link>
        </div>
        </div>
      </div>

      {/* プラン変更モーダル */}
      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} />}
    </OrganizerPageShell>
  );
}
