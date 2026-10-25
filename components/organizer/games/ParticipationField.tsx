"use client";

export type GameParticipationChoice = "onsite" | "remote";

const OPTIONS: { id: GameParticipationChoice; label: string; blurb: string }[] = [
  { id: "onsite", label: "現地で参加", blurb: "会場やスポットのQRを読んで始めます" },
  { id: "remote", label: "どこからでも参加", blurb: "参加コードを入れて始めます。申し込んだ人の参加パスにコードが出ます" },
];

/** 参加のしかた。現地に来なくても遊べるゲームは、参加コードで始められるようにする。 */
export function ParticipationField({
  value,
  onChange,
}: {
  value: GameParticipationChoice;
  onChange: (value: GameParticipationChoice) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.6rem" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>参加のしかた</span>
      <div role="radiogroup" aria-label="参加のしかた" style={{ display: "grid", gap: "0.35rem" }}>
        {OPTIONS.map((option) => {
          const on = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(option.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                width: "100%",
                padding: "0.6rem 0.75rem",
                border: `1.5px solid ${on ? "#1f7a4a" : "#e2ebe5"}`,
                borderRadius: "0.8rem",
                background: on ? "#f3faf5" : "#fff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "none",
                  width: "1.1rem",
                  height: "1.1rem",
                  borderRadius: "50%",
                  border: `2px solid ${on ? "#1f7a4a" : "#b9c4bd"}`,
                  boxShadow: on ? "inset 0 0 0 3px #fff" : undefined,
                  background: on ? "#1f7a4a" : "#fff",
                }}
              />
              <span style={{ display: "grid", gap: "0.1rem" }}>
                <b style={{ fontSize: "0.88rem", color: "#1a2214" }}>{option.label}</b>
                <small style={{ fontSize: "0.72rem", color: "#6a7568", lineHeight: 1.4 }}>{option.blurb}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
