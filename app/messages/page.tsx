"use client";

const C = {
  bg: "#f6f2eb",
  surface: "#ffffff",
  border: "#e6dfd4",
  border2: "#ede8df",
  t1: "#19170f",
  t2: "#5a5448",
  t3: "#9e9688",
  green: "#2e8a5a",
  blue: "#3460a8",
  orange: "#b85c2a",
  shadow: "0 1px 4px rgba(0,0,0,.06)",
} as const;

export default function MessagesPage() {
  return (
    <div className="ms-anim-up" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: C.bg }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: C.shadow }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 24, height: 24, strokeWidth: 1.5, color: C.t3 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif JP', serif", fontSize: 20, fontWeight: 500, color: C.t1, marginBottom: 8, letterSpacing: "-.3px" }}>
        会話を選んでください
      </div>
      <p style={{ fontSize: 12.5, color: C.t3, textAlign: "center", lineHeight: 1.8, maxWidth: 240, marginBottom: 28 }}>
        左のイベントを開いて<br />やり取りする相手を選んでください
      </p>
      <div style={{ display: "flex", gap: 9 }}>
        {[
          { color: C.green, title: "主催者として", desc: "参加者・ボランティア応募者と" },
          { color: C.blue,  title: "ボランティア", desc: "活動先の主催者と" },
          { color: C.orange,title: "参加者として", desc: "イベント主催者と" },
        ].map((r) => (
          <div key={r.title} className="ms-rcard"
            style={{ width: 132, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 14px 12px", cursor: "pointer", transition: "all .18s cubic-bezier(.22,1,.36,1)", boxShadow: C.shadow }}>
            <div style={{ width: 24, height: 3, borderRadius: 2, background: r.color, marginBottom: 10 }} />
            <b style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 4 }}>{r.title}</b>
            <span style={{ fontSize: 10.5, color: C.t3, lineHeight: 1.5, display: "block" }}>{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
