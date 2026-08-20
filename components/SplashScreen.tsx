"use client";

import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  CircleHelp,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WELCOME_ROLE_CARDS } from "@/components/welcome/welcome-splash-shared";
import { isGuestSplashReturnPath } from "@/lib/top-mode-active";

const FADE_MS = 600;
const NAV_DELAY_MS = 120;
const PETAL_COUNT = 48;
const SPLASH_DISMISSED_KEY = "mg-splash-dismissed";

function isOrganizerPath(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/organizer")) return true;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    const next = new URLSearchParams(search).get("next");
    if (next?.startsWith("/organizer")) return true;
  }
  return false;
}

function isSplashDismissed(persistent: boolean): boolean {
  try {
    const storage = persistent ? localStorage : sessionStorage;
    return storage.getItem(SPLASH_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function markSplashDismissed(persistent: boolean): void {
  try {
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem(SPLASH_DISMISSED_KEY, "1");
  } catch {
    // storage 不可時はスキップ
  }
}

function clearSessionSplashDismissed(): void {
  try {
    sessionStorage.removeItem(SPLASH_DISMISSED_KEY);
  } catch {
    // ignore
  }
}

function resolveSplashVisibility(
  pathname: string,
  search: string,
  user: User | null
): { ready: boolean; gone: boolean } {
  // 申込確認シートの見た目確認中はスプラッシュを出さない
  if (new URLSearchParams(search).get("previewApplyConfirm") === "1") {
    return { ready: false, gone: true };
  }

  if (isOrganizerPath(pathname, search)) {
    return { ready: false, gone: true };
  }

  if (user) {
    if (pathname !== "/") return { ready: false, gone: true };
    if (isSplashDismissed(true)) return { ready: false, gone: true };
    return { ready: true, gone: false };
  }

  if (isGuestSplashReturnPath(pathname)) {
    clearSessionSplashDismissed();
    return { ready: true, gone: false };
  }

  return { ready: false, gone: true };
}

const SAKURA_COLORS = [
  "#E8385A", "#F06090", "#FF80A8", "#C83880",
  "#E8583A", "#F0A040", "#FFD060",
  "#3A8F5A", "#4CAF50", "#66BB6A",
  "#3A70C8", "#6A9AE8", "#80C8F0",
  "#8858C8", "#B080E8", "#C850A0",
];

type Petal = {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vrot: number;
  r: number; color: string;
  sway: number; ss: number; alpha: number;
};

function drawBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,    "#F0F2F5");
  grad.addColorStop(0.2,  "#E8ECF2");
  grad.addColorStop(0.45, "#F5F5F8");
  grad.addColorStop(0.65, "#E0E4EC");
  grad.addColorStop(0.85, "#EEF0F5");
  grad.addColorStop(1,    "#E8EAF0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const gold = ctx.createLinearGradient(0, H * 0.3, W, H * 0.7);
  gold.addColorStop(0,   "rgba(200,170,80,0)");
  gold.addColorStop(0.5, "rgba(215,185,90,0.10)");
  gold.addColorStop(1,   "rgba(200,170,80,0)");
  ctx.fillStyle = gold;
  ctx.fillRect(0, 0, W, H);

  const bands: [number, number, number, number, string][] = [
    [0, 0, W * 0.5, H, "rgba(255,255,255,0.65)"],
    [W * 0.3, 0, W, H * 0.6, "rgba(255,255,255,0.45)"],
    [W, 0, W * 0.4, H, "rgba(220,225,240,0.45)"],
  ];
  for (const [x0, y0, x1, y1, c] of bands) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, c); g.addColorStop(0.4, c); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1;

  const spot = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.5);
  spot.addColorStop(0, "rgba(255,255,255,0.55)");
  spot.addColorStop(1, "rgba(230,232,240,0)");
  ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = Math.random() * 1.8;
    const b = Math.random();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = b > 0.7
      ? "rgba(255,255,255,0.8)"
      : b > 0.4
      ? "rgba(200,205,220,0.5)"
      : "rgba(180,170,100,0.3)";
    ctx.globalAlpha = 1;
    ctx.fill();
  }
}

function drawSakura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, rotation: number, alpha: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  for (let i = 0; i < 5; i++) {
    const a  = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r * 0.52, py = Math.sin(a) * r * 0.52;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);

    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.27, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = alpha * 0.32; ctx.fill();

    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.27, r * 0.45, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = alpha * 0.8; ctx.stroke();

    ctx.beginPath();
    ctx.arc(-r * 0.07, -r * 0.41, r * 0.07, 0, Math.PI * 2);
    ctx.arc( r * 0.07, -r * 0.41, r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = alpha * 0.25; ctx.fill();
    ctx.restore();
  }

  ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,220,0.95)"; ctx.globalAlpha = alpha; ctx.fill();

  for (let s = 0; s < 5; s++) {
    const sa = (s / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.08, Math.sin(sa) * r * 0.08);
    ctx.lineTo(Math.cos(sa) * r * 0.28, Math.sin(sa) * r * 0.28);
    ctx.strokeStyle = color; ctx.lineWidth = 0.7; ctx.globalAlpha = alpha * 0.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.cos(sa) * r * 0.3, Math.sin(sa) * r * 0.3, r * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = alpha * 0.6; ctx.fill();
  }
  ctx.restore();
}

function createPetals(w: number, h: number): Petal[] {
  return Array.from({ length: PETAL_COUNT }, () => ({
    x:     Math.random() * w,
    y:     -20 - Math.random() * h * 0.9,
    vx:    (Math.random() - 0.5) * 1.3,
    vy:    0.5 + Math.random() * 1.2,
    rot:   Math.random() * Math.PI * 2,
    vrot:  (Math.random() - 0.5) * 0.04,
    r:     5 + Math.random() * 8,
    color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
    sway:  Math.random() * Math.PI * 2,
    ss:    0.012 + Math.random() * 0.018,
    alpha: 0.6 + Math.random() * 0.35,
  }));
}

export function SplashScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  /** SSR/CSR で一致させるため初期は非表示。表示可否は useEffect でのみ決める */
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(true);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const petalRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const petalsRef = useRef<Petal[]>([]);
  const respawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyVisibility = useCallback((authUser: User | null) => {
    const { pathname, search } = window.location;
    const next = resolveSplashVisibility(pathname, search, authUser);
    setReady(next.ready);
    setGone(next.gone);
  }, []);

  // スプラッシュ専用: getSession のみ（リトライ/API 補完なしで即判定）
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      applyVisibility(null);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const authUser = session?.user ?? null;
      setUser(authUser);
      applyVisibility(authUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const authUser = session?.user ?? null;
      setUser(authUser);
      applyVisibility(authUser);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyVisibility]);

  useEffect(() => {
    if (!ready) return;

    const bg = bgRef.current;
    if (bg) drawBackground(bg);

    const canvas = petalRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      petalsRef.current = createPetals(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const animate = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of petalsRef.current) {
        if (p.y > h + 20) continue;
        alive = true;
        p.sway += p.ss;
        p.x += p.vx + Math.sin(p.sway) * 0.65;
        p.y += p.vy;
        p.rot += p.vrot;
        drawSakura(ctx, p.x, p.y, p.r, p.color, p.rot, p.alpha);
      }
      if (!alive) {
        respawnRef.current = setTimeout(() => {
          petalsRef.current = createPetals(canvas.width, canvas.height);
        }, 600);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const startId = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(animate);
    });

    return () => {
      running = false;
      cancelAnimationFrame(startId);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      if (respawnRef.current) clearTimeout(respawnRef.current);
    };
  }, [ready]);

  const dismiss = useCallback(() => {
    if (fading) return;
    if (user) markSplashDismissed(true);
    setFading(true);
    setTimeout(() => setGone(true), FADE_MS);
  }, [fading, user]);

  const navigate = useCallback(
    (href: string) => {
      const target = new URL(href, window.location.origin);
      if (user) {
        markSplashDismissed(true);
      } else if (isOrganizerPath(target.pathname, target.search)) {
        markSplashDismissed(false);
      }
      const sameLocation =
        target.pathname === window.location.pathname &&
        target.search === window.location.search;

      dismiss();
      if (sameLocation) return;

      const path = `${target.pathname}${target.search}${target.hash}`;
      setTimeout(() => router.push(path), NAV_DELAY_MS);
    },
    [dismiss, router, user]
  );

  if (!ready || gone) return null;

  return (
    <>
      <style>{`
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
        .sp-trust-text {
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .sp-trust-title,
        .sp-trust-sub {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .sp-cta-row {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
          align-items: stretch;
          gap: 10px;
          width: 100%;
          max-width: 560px;
        }
        .sp-cta-primary,
        .sp-cta-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          min-width: 0;
          border-radius: 10px;
          line-height: 1.3;
          cursor: pointer;
          box-sizing: border-box;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .sp-cta-primary {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          min-height: 50px;
          padding: 12px 16px;
          font-size: 14px;
          border: none;
          font-weight: 600;
          color: #0f2744;
          text-shadow: 0 1px 0 rgba(255,255,255,0.55);
          background: linear-gradient(
            118deg,
            #dff6ff 0%,
            #fde8f8 16%,
            #fff9e6 32%,
            #e6ffef 48%,
            #ebe9ff 64%,
            #d4f8ff 80%,
            #fff5f0 100%
          );
          background-size: 240% 240%;
          animation: spCtaIridescent 9s ease-in-out infinite;
          box-shadow:
            0 2px 16px rgba(120, 200, 255, 0.35),
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 0 0 1px rgba(255,255,255,0.65);
        }
        .sp-cta-primary-front {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          row-gap: 4px;
          min-width: 0;
          width: 100%;
        }
        .sp-cta-primary::after {
          content: "";
          position: absolute;
          inset: -20% -60%;
          z-index: 1;
          background: linear-gradient(
            105deg,
            transparent 0%,
            rgba(255,255,255,0) 42%,
            rgba(255,255,255,0.75) 50%,
            rgba(255,255,255,0) 58%,
            transparent 100%
          );
          animation: spCtaShine 4.5s ease-in-out infinite;
          pointer-events: none;
          mix-blend-mode: soft-light;
        }
        .sp-cta-primary .sp-cta-icon {
          color: #0f2744;
          filter: drop-shadow(0 1px 0 rgba(255,255,255,0.6));
        }
        .sp-cta-primary:active,
        .sp-cta-secondary:active { transform: scale(0.98); }
        .sp-cta-primary:hover {
          filter: brightness(1.05) saturate(1.08);
          box-shadow:
            0 4px 22px rgba(130, 210, 255, 0.45),
            0 1px 0 rgba(255,255,255,0.95) inset,
            0 0 0 1px rgba(255,255,255,0.75);
        }
        .sp-cta-secondary:hover { opacity: 0.92; }
        @media (prefers-reduced-motion: reduce) {
          .sp-cta-primary {
            animation: none;
            background-position: 50% 50%;
          }
          .sp-cta-primary::after { animation: none; opacity: 0; }
          .sp-trust { animation: none; opacity: 1; }
          .sp-card:hover .sp-card-icon-wrap { transform: none; }
        }
        .sp-cta-secondary {
          min-height: 44px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #2a2a3a;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(195,195,215,0.95);
        }
        .sp-cta-icon { flex-shrink: 0; }
        @media (max-width: 480px) {
          .sp-cta-row {
            grid-template-columns: 1fr;
            max-width: 320px;
            gap: 8px;
          }
          .sp-cta-primary {
            min-height: 48px;
            font-size: 13px;
            padding: 12px 14px;
            gap: 6px;
            flex-wrap: nowrap;
          }
          .sp-cta-primary-front { flex-wrap: nowrap; gap: 6px; }
          .sp-cta-secondary {
            min-height: 42px;
            font-size: 12px;
            padding: 10px 12px;
          }
        }
        .sp-card:hover {
          background: #ffffff !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08) !important;
        }
        .sp-card:active { transform: translateY(0) scale(0.98); }
        .sp-card-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            0 3px 14px rgba(15, 23, 42, 0.07);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .sp-card:hover .sp-card-icon-wrap {
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 5px 18px rgba(15, 23, 42, 0.1);
          transform: scale(1.04);
        }
        .sp-card-icon-wrap--sky {
          background: linear-gradient(150deg, #effbff 0%, #f5feff 42%, #eefcfb 100%);
          color: #06b6d4;
        }
        .sp-card-icon-wrap--warm {
          background: linear-gradient(150deg, #fffbf5 0%, #fff7ed 40%, #ffedd5 100%);
          color: #f97316;
        }
        .sp-card-icon-wrap--leaf {
          background: linear-gradient(150deg, #f7fef9 0%, #f0fdf4 48%, #ecfdf3 100%);
          color: #22c55e;
        }
        .sp-card-icon-wrap svg {
          filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.55));
        }
        .sp-card-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 4px;
          padding: 8px 14px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
          border: 1px solid transparent;
          background: transparent;
          transition: border-color 0.15s ease, color 0.15s ease, gap 0.15s ease;
        }
        .sp-card:hover .sp-card-cta { gap: 6px; }
        .sp-card-cta--mint {
          border-color: #9bc4a8;
          color: #2a6b45;
        }
        .sp-card-cta--cream {
          border-color: #d4c4a8;
          color: #8a7038;
        }
        .sp-mobile-only  { display: none; }
        .sp-desktop-only { display: inline; }
        @media (max-width: 560px) {
          .sp-mobile-only  { display: inline; }
          .sp-desktop-only { display: none; }
          .sp-content { padding: 0 12px !important; }
          .sp-cards   { gap: 6px !important; }
          .sp-card    { padding: 14px 8px !important; }
          .sp-card-title { font-size: 10px !important; }
          .sp-card-desc  { font-size: 9px !important; }
          .sp-card-cta   { font-size: 9px !important; padding: 6px 10px !important; }
          .sp-card-icon-wrap { width: 40px !important; height: 40px !important; }
          .sp-trust-cell { padding: 6px 4px !important; gap: 4px !important; }
          .sp-trust-title { font-size: 9px !important; }
          .sp-trust-sub { font-size: 7px !important; line-height: 1.25 !important; letter-spacing: -0.02em !important; }
          .sp-trust-icon { width: 17px !important; height: 17px !important; }
          .sp-top-bar { gap: 6px !important; right: max(8px, env(safe-area-inset-right)) !important; }
          .sp-top-bar .sp-top-guide { font-size: 11px !important; }
          .sp-top-bar .sp-top-login { font-size: 11px !important; padding: 5px 10px !important; }
        }
      `}</style>

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
          pointerEvents: fading ? "none" : "auto",
        }}
      >
        {/* Layer 1: background canvas */}
        <canvas
          ref={bgRef}
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
        />

        {/* Layer 2: sakura petal canvas */}
        <canvas
          ref={petalRef}
          style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
        />

        {/* Top-right: 使い方ガイド + ログイン */}
        <div
          className="sp-top-bar"
          style={{
            position: "absolute",
            top: "max(10px, env(safe-area-inset-top))",
            right: "max(12px, env(safe-area-inset-right))",
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/guide")}
            className="sp-top-guide"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              margin: 0,
              padding: "4px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: "#8a7038",
              letterSpacing: "0.02em",
              transition: "opacity 0.15s ease, transform 0.15s ease",
            }}
            aria-label="使い方ガイド（読みもの・街ガイド）"
          >
            <CircleHelp size={15} strokeWidth={1.35} aria-hidden style={{ flexShrink: 0, opacity: 0.92 }} />
            使い方ガイド
          </button>
          <button
            type="button"
            className="sp-top-login"
            onClick={() => navigate("/auth?next=/")}
            style={{
              padding: "6px 14px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 500,
              color: "#2a3440",
              background: "rgba(255,255,255,0.98)",
              border: "1px solid rgba(200,200,215,0.95)",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
              whiteSpace: "nowrap",
              transition: "filter 0.15s ease, transform 0.15s ease",
            }}
            aria-label="ログイン"
          >
            ログイン
          </button>
        </div>

        {/* Layer 3: content — slightly above center for visual balance */}
        <div
          className="sp-content"
          style={{
            position: "relative", zIndex: 3,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16,
            width: "100%", maxWidth: 600,
            padding: "0 24px",
            marginTop: "-4vh",
          }}
        >
          {/* 1. Eyebrow */}
          <p className="sp-eyebrow" style={{ fontSize: 10, letterSpacing: "0.18em", color: "#5A5A6A", fontWeight: 500, margin: 0 }}>
            MachiGlyph のはじめかた
          </p>

          {/* 2. Title */}
          <h1
            className="sp-title"
            style={{
              fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600, margin: 0,
              fontFamily: "var(--font-noto-serif-jp, var(--font-heading, serif))",
              color: "#1A1A1A", textAlign: "center", lineHeight: 1.5,
            }}
          >
            まちの出来事に、出会う。
          </h1>

          {/* 3. Sub */}
          <p className="sp-sub" style={{ fontSize: 13, color: "#3A3A4A", lineHeight: 1.8, margin: 0, textAlign: "center" }}>
            イベントを探したい人も、募集を見たい人も、<br />活動をはじめたい人も、ここから
          </p>

          {/* 4. Divider */}
          <div
            className="sp-divider"
            style={{
              width: 36, height: 1,
              background: "linear-gradient(to right, #A0A0B8, #D0D0E0, #A0A0B8)",
            }}
          />

          {/* 5. Role cards */}
          <div
            className="sp-cards"
            style={{
              display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10, width: "100%", alignItems: "stretch",
            }}
          >
            {WELCOME_ROLE_CARDS.map((card) => {
              const { Icon, iconAccent } = card;
              const ctaClass =
                iconAccent === "warm"
                  ? "sp-card-cta sp-card-cta--cream"
                  : "sp-card-cta sp-card-cta--mint";
              const iconWrapClass =
                iconAccent === "warm"
                  ? "sp-card-icon-wrap sp-card-icon-wrap--warm"
                  : iconAccent === "leaf"
                    ? "sp-card-icon-wrap sp-card-icon-wrap--leaf"
                    : "sp-card-icon-wrap sp-card-icon-wrap--sky";
              return (
                <button
                  key={card.href}
                  type="button"
                  className="sp-card"
                  onClick={() => navigate(card.href)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    borderRadius: 16,
                    padding: "18px 12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
                    minHeight: 0,
                  }}
                >
                  <div className={iconWrapClass} aria-hidden>
                    <Icon strokeWidth={1.75} size={22} />
                  </div>
                  <span className="sp-card-title" style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}>
                    <span className="sp-desktop-only">{card.title}</span>
                    <span className="sp-mobile-only">{card.mobileTitle}</span>
                  </span>
                  <span
                    className="sp-card-desc"
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      lineHeight: 1.55,
                      flexGrow: 1,
                      textWrap: "pretty",
                    }}
                  >
                    <span className="sp-desktop-only">{card.desc}</span>
                    <span className="sp-mobile-only">{card.mobileDesc}</span>
                  </span>
                  <span className={ctaClass}>
                    {card.buttonLabel}
                    <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>

          {/* 6. Footer CTAs（主＝虹彩グラデ・副＝白枠） */}
          <div className="sp-links sp-cta-row">
            <button
              type="button"
              className="sp-cta-primary"
              onClick={() => navigate("/")}
            >
              <span className="sp-cta-primary-front">
                <Sparkles className="sp-cta-icon" size={16} strokeWidth={2} aria-hidden />
                まずはイベントを見てみる
                <ArrowRight className="sp-cta-icon" size={16} strokeWidth={2} aria-hidden />
              </span>
            </button>
            <button type="button" className="sp-cta-secondary" onClick={dismiss}>
              あとで決める
            </button>
          </div>

          {/* 7. 特長バナー（安心・地域・かんたん） */}
          <aside
            className="sp-trust"
            aria-label="MachiGlyphの特長"
            style={{
              width: "100%",
              maxWidth: "min(100%, 600px)",
              alignSelf: "center",
              marginTop: 4,
              background: "rgba(255, 255, 255, 0.92)",
              borderRadius: 14,
              boxShadow: "0 2px 16px rgba(15, 23, 42, 0.045), 0 1px 0 rgba(255, 255, 255, 0.85) inset",
              border: "1px solid rgba(235, 238, 245, 0.98)",
              display: "flex",
              alignItems: "stretch",
              overflow: "hidden",
            }}
          >
            {(
              [
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
              ] as const
            ).map((item, idx) => (
              <Fragment key={item.title}>
                {idx > 0 ? (
                  <div
                    aria-hidden
                    style={{
                      width: 1,
                      flexShrink: 0,
                      alignSelf: "stretch",
                      background: "#eceef2",
                      margin: "8px 0",
                    }}
                  />
                ) : null}
                <div
                  className="sp-trust-cell"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    padding: "9px 8px",
                    minWidth: 0,
                  }}
                >
                  <item.Icon
                    className="sp-trust-icon"
                    size={19}
                    strokeWidth={1.35}
                    aria-hidden
                    color="#22c55e"
                    style={{ flexShrink: 0, opacity: 0.95 }}
                  />
                  <div className="sp-trust-text" style={{ textAlign: "left" }}>
                    <p
                      className="sp-trust-title"
                      title={item.title}
                      style={{
                        margin: 0,
                        fontSize: 10.5,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: "#3d3d4a",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="sp-trust-sub"
                      title={item.sub}
                      style={{
                        margin: "2px 0 0",
                        fontSize: 8,
                        fontWeight: 400,
                        lineHeight: 1.25,
                        color: "#6f6f7a",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
              </Fragment>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
