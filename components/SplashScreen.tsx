"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const FADE_MS = 600;

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
  return Array.from({ length: 75 }, () => ({
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

const ROLE_CARDS = [
  {
    icon: "📅",
    title: "イベントを探したい",
    desc: "地域で開かれているイベントを見つけて参加できます",
    link: "イベントを見る →",
    href: "/",
  },
  {
    icon: "🤝",
    title: "募集を見たい",
    desc: "参加募集やお手伝いの募集を探せます",
    link: "募集を見る →",
    href: "/recruitments",
  },
  {
    icon: "🌱",
    title: "活動をはじめたい",
    desc: "イベントを開いたり募集を掲載したりできます",
    link: "この使い方ではじめる →",
    href: "/auth?next=/organizer",
  },
] as const;

export function SplashScreen() {
  const [ready,  setReady]  = useState(false); // 認証確認後に true
  const [fading, setFading] = useState(false);
  const [gone,   setGone]   = useState(false);
  const [query,  setQuery]  = useState("");
  const bgRef    = useRef<HTMLCanvasElement>(null);
  const petalRef = useRef<HTMLCanvasElement>(null);
  const rafRef   = useRef<number>(0);
  const petalsRef      = useRef<Petal[]>([]);
  const respawnRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // / 以外のページではスプラッシュ不要
  useEffect(() => {
    if (window.location.pathname !== "/") {
      setGone(true);
      return;
    }
    // / では常に表示
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const bg = bgRef.current;
    if (bg) drawBackground(bg);

    const canvas = petalRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      petalsRef.current = createPetals(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of petalsRef.current) {
        if (p.y > h + 20) continue;
        alive = true;
        p.sway += p.ss;
        p.x    += p.vx + Math.sin(p.sway) * 0.65;
        p.y    += p.vy;
        p.rot  += p.vrot;
        drawSakura(ctx, p.x, p.y, p.r, p.color, p.rot, p.alpha);
      }
      if (!alive) {
        respawnRef.current = setTimeout(() => {
          petalsRef.current = createPetals(canvas.width, canvas.height);
        }, 600);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      if (respawnRef.current) clearTimeout(respawnRef.current);
    };
  }, [ready]);

  const dismiss = useCallback(() => {
    if (fading) return;
    setFading(true);
    setTimeout(() => setGone(true), FADE_MS);
  }, [fading]);

  const navigate = useCallback((href: string) => {
    dismiss();
    if (href !== "/") {
      setTimeout(() => router.push(href), 80);
    }
  }, [dismiss, router]);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    navigate(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
  }, [navigate, query]);

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
        .sp-eyebrow { animation: fadeUp 0.8s ease-out 0.2s both; }
        .sp-title   { animation: fadeUp 0.9s ease-out 0.5s both; }
        .sp-sub     { animation: fadeUp 0.8s ease-out 0.8s both; }
        .sp-divider { animation: fadeIn 0.6s ease-out 1.0s both; }
        .sp-cards   { animation: fadeUp 0.8s ease-out 1.1s both; }
        .sp-search  { animation: fadeUp 0.7s ease-out 1.5s both; }
        .sp-links   { animation: fadeIn 0.6s ease-out 1.8s both; }
        .sp-card:hover {
          background: rgba(255,255,255,0.94) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
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

        {/* Layer 3: content — slightly above center for visual balance */}
        <div
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
            イベントを探したい人も、募集を見たい人も、<br />活動をはじめたい人も、ここからどうぞ。
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
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10, width: "100%", alignItems: "stretch",
            }}
          >
            {ROLE_CARDS.map((card) => (
              <button
                key={card.href}
                type="button"
                className="sp-card"
                onClick={() => navigate(card.href)}
                style={{
                  background: "rgba(255,255,255,0.80)",
                  border: "0.5px solid rgba(160,160,200,0.45)",
                  borderRadius: 12, padding: "16px 12px",
                  textAlign: "center",
                  backdropFilter: "blur(8px)",
                  cursor: "pointer",
                  transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{card.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2A" }}>{card.title}</span>
                <span style={{ fontSize: 10, color: "#5A5A6A", lineHeight: 1.5, flexGrow: 1 }}>{card.desc}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: "#3A3A5A", marginTop: 4 }}>{card.link}</span>
              </button>
            ))}
          </div>

          {/* 6. Search bar */}
          <div
            className="sp-search"
            style={{
              display: "flex", gap: 8, width: "100%", maxWidth: 460,
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="地域名・イベント名で検索"
              style={{
                flex: 1, padding: "10px 14px", fontSize: 13,
                border: "1px solid rgba(160,160,200,0.5)", borderRadius: 6,
                background: "rgba(255,255,255,0.85)", color: "#1A1A1A", outline: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #3A3A5A, #2A2A3A)",
                color: "#fff", border: "none", borderRadius: 6,
                fontSize: 12, cursor: "pointer", fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              探す
            </button>
          </div>

          {/* 7. Footer links */}
          <div className="sp-links" style={{ display: "flex", gap: 20 }}>
            <button
              type="button"
              onClick={() => navigate("/events")}
              style={{
                fontSize: 12, color: "#3A3A5A", fontWeight: 500,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: "1px solid rgba(90,90,120,0.4)", paddingBottom: 1,
              }}
            >
              まずはイベントを見てみる
            </button>
            <button
              type="button"
              onClick={dismiss}
              style={{
                fontSize: 12, color: "#8A8A9A",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              あとで決める
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
