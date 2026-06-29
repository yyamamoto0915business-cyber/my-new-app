import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Handshake,
  Heart,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";

export type RoleIconAccent = "sky" | "warm" | "leaf";

export const WELCOME_ROLE_CARDS: {
  Icon: LucideIcon;
  iconAccent: RoleIconAccent;
  title: string;
  mobileTitle: string;
  desc: ReactNode;
  mobileDesc: string;
  buttonLabel: string;
  href: string;
}[] = [
  {
    Icon: CalendarDays,
    iconAccent: "sky",
    title: "イベントを探したい",
    mobileTitle: "イベントを探す",
    desc: (
      <>
        <span style={{ whiteSpace: "nowrap" }}>地域で開催されるイベントを</span>
        <br />
        <span style={{ whiteSpace: "nowrap" }}>見つけて参加できます。</span>
      </>
    ),
    mobileDesc: "地域のイベントに参加できます",
    buttonLabel: "イベントを見る",
    href: "/",
  },
  {
    Icon: Handshake,
    iconAccent: "warm",
    title: "募集を見たい",
    mobileTitle: "募集を見る",
    desc: (
      <>
        <span style={{ whiteSpace: "nowrap" }}>ボランティアやまちおこしの</span>
        <br />
        <span style={{ whiteSpace: "nowrap" }}>募集を見つけられます。</span>
      </>
    ),
    mobileDesc: "ボランティア活動を探せます",
    buttonLabel: "募集を見る",
    href: "/volunteer",
  },
  {
    Icon: Sprout,
    iconAccent: "leaf",
    title: "イベントを掲載したい",
    mobileTitle: "掲載する",
    desc: "イベントを開いたり募集を掲載できます。",
    mobileDesc: "イベントや募集を掲載できます",
    buttonLabel: "使い方を見る",
    href: "/auth?next=/organizer",
  },
];

export const WELCOME_TRUST_ITEMS = [
  {
    Icon: ShieldCheck,
    title: "安心・安全の情報",
    sub: "運営確認で安心してお使いいただけます",
  },
  {
    Icon: Users,
    title: "地域のつながりを応援",
    sub: "まちの活動を見つけてつながれます",
  },
  {
    Icon: Heart,
    title: "はじめてでもかんたん",
    sub: "シンプルな操作ですぐ使えます",
  },
] as const;

export const WELCOME_SPLASH_STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spCtaIridescent {
    0%, 100% { background-position: 8% 42%; }
    50% { background-position: 92% 58%; }
  }
  @keyframes spCtaShine {
    0%, 100% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
    12% { opacity: 1; }
    28% { transform: translateX(120%) skewX(-12deg); opacity: 0; }
  }
  .sp-top-bar { animation: fadeIn 0.55s ease-out 0.1s both; }
  .sp-top-guide:hover { opacity: 0.88; }
  .sp-top-guide:active { transform: scale(0.98); }
  .sp-top-login:hover { filter: brightness(1.02); }
  .sp-top-login:active { transform: scale(0.98); }
  .sp-eyebrow { animation: fadeUp 0.8s ease-out 0.2s both; }
  .sp-title   { animation: fadeUp 0.9s ease-out 0.5s both; }
  .sp-sub     { animation: fadeUp 0.8s ease-out 0.8s both; }
  .sp-divider { animation: fadeIn 0.6s ease-out 1.0s both; }
  .sp-cards   { animation: fadeUp 0.8s ease-out 1.1s both; }
  .sp-links   { animation: fadeIn 0.6s ease-out 1.8s both; }
  .sp-trust   { animation: fadeIn 0.65s ease-out 2.05s both; }
  .sp-trust-text { min-width: 0; flex: 1; overflow: hidden; }
  .sp-trust-title, .sp-trust-sub {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
  }
  .sp-cta-row {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    align-items: stretch;
    gap: 10px;
    width: 100%;
    max-width: 560px;
  }
  .sp-cta-primary, .sp-cta-secondary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; min-width: 0; border-radius: 10px; line-height: 1.3;
    cursor: pointer; box-sizing: border-box;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .sp-cta-primary {
    position: relative; isolation: isolate; overflow: hidden;
    min-height: 50px; padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f2744;
    border: 1px solid rgba(255,255,255,0.75);
    background: linear-gradient(135deg, #fff5f0 0%, #ffe8f5 18%, #f0e8ff 36%, #e8f4ff 54%, #e0fff5 72%, #ebe9ff 64%, #d4f8ff 80%, #fff5f0 100%);
    background-size: 240% 240%;
    animation: spCtaIridescent 9s ease-in-out infinite;
    box-shadow: 0 2px 16px rgba(120, 200, 255, 0.35), 0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(255,255,255,0.65);
  }
  .sp-cta-primary-front {
    position: relative; z-index: 2; display: flex; flex-wrap: wrap;
    align-items: center; justify-content: center; gap: 8px; row-gap: 4px;
    min-width: 0; width: 100%;
  }
  .sp-cta-primary::after {
    content: ""; position: absolute; inset: -20% -60%; z-index: 1;
    background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 58%, transparent 100%);
    animation: spCtaShine 4.5s ease-in-out infinite; pointer-events: none; mix-blend-mode: soft-light;
  }
  .sp-cta-primary .sp-cta-icon { color: #0f2744; filter: drop-shadow(0 1px 0 rgba(255,255,255,0.6)); }
  .sp-cta-primary:active, .sp-cta-secondary:active { transform: scale(0.98); }
  .sp-cta-primary:hover {
    filter: brightness(1.05) saturate(1.08);
    box-shadow: 0 4px 22px rgba(130, 210, 255, 0.45), 0 1px 0 rgba(255,255,255,0.95) inset, 0 0 0 1px rgba(255,255,255,0.75);
  }
  .sp-cta-secondary:hover { opacity: 0.92; }
  .sp-cta-secondary {
    min-height: 44px; padding: 9px 12px; font-size: 13px; font-weight: 500; color: #2a2a3a;
    background: rgba(255,255,255,0.96); border: 1px solid rgba(195,195,215,0.95);
  }
  .sp-cta-icon { flex-shrink: 0; }
  .sp-card:hover {
    background: #ffffff !important; transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08) !important;
  }
  .sp-card:active { transform: translateY(0) scale(0.98); }
  .sp-card-icon-wrap {
    width: 48px; height: 48px; border-radius: 9999px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 3px 14px rgba(15, 23, 42, 0.07);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .sp-card:hover .sp-card-icon-wrap {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 5px 18px rgba(15, 23, 42, 0.1);
    transform: scale(1.04);
  }
  .sp-card-icon-wrap--sky {
    background: linear-gradient(150deg, #effbff 0%, #f5feff 42%, #eefcfb 100%); color: #06b6d4;
  }
  .sp-card-icon-wrap--warm {
    background: linear-gradient(150deg, #fffbf5 0%, #fff7ed 40%, #ffedd5 100%); color: #f97316;
  }
  .sp-card-icon-wrap--leaf {
    background: linear-gradient(150deg, #f7fef9 0%, #f0fdf4 48%, #ecfdf3 100%); color: #22c55e;
  }
  .sp-card-icon-wrap svg { filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.55)); }
  .sp-card-cta {
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    margin-top: 4px; padding: 8px 14px; border-radius: 9999px;
    font-size: 11px; font-weight: 600; line-height: 1.2; border: 1px solid transparent;
    background: transparent; transition: border-color 0.15s ease, color 0.15s ease, gap 0.15s ease;
  }
  .sp-card:hover .sp-card-cta { gap: 6px; }
  .sp-card-cta--mint { border-color: #9bc4a8; color: #2a6b45; }
  .sp-card-cta--cream { border-color: #d4c4a8; color: #8a7038; }
  .sp-mobile-only  { display: none; }
  .sp-desktop-only { display: inline; }
  .welcome-splash--embedded .sp-content {
    max-width: none !important;
    padding: 24px 20px 20px !important;
    margin-top: 0 !important;
  }
  .welcome-splash--embedded .sp-cards { gap: 8px !important; }
  .welcome-splash--embedded .sp-cta-row { max-width: none !important; }
  .welcome-splash--embedded .sp-trust { max-width: none !important; }
  @media (max-width: 480px) {
    .sp-cta-row { grid-template-columns: 1fr; max-width: 320px; gap: 8px; }
    .sp-cta-primary { min-height: 48px; font-size: 13px; padding: 12px 14px; }
    .sp-cta-secondary { min-height: 42px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .sp-cta-primary { animation: none; background-position: 50% 50%; }
    .sp-cta-primary::after { animation: none; opacity: 0; }
    .sp-trust { animation: none; opacity: 1; }
    .sp-card:hover .sp-card-icon-wrap { transform: none; }
  }
`;
