"use client";

const C = {
  bg: "#f8f7f4",
  t1: "#19170f",
  t3: "#9e9688",
  border: "#e8e3db",
  surface: "#ffffff",
} as const;

export default function MessagesPage() {
  return (
    <div
      className="ms-anim-up"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        background: C.bg,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: C.surface,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 22, height: 22, strokeWidth: 1.5, color: C.t3 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.t1, marginBottom: 8 }}>会話を選んでください</div>
      <p style={{ fontSize: 13, color: C.t3, textAlign: "center", lineHeight: 1.7, maxWidth: 240 }}>
        左の一覧から相手を選ぶと、ここに表示されます
      </p>
    </div>
  );
}
