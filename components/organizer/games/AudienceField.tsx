"use client";

export type GameAudienceChoice = "anyone" | "event" | "pass";

const OPTIONS: { id: GameAudienceChoice; label: string; blurb: string }[] = [
  { id: "anyone", label: "誰でも", blurb: "参加用QRから、誰でも入れます" },
  { id: "event", label: "イベントの参加者だけ", blurb: "対象イベントに申し込んだアカウントだけが入れます" },
  { id: "pass", label: "参加パスを持っている人だけ", blurb: "対象イベントの参加パス（支払い済み・スタッフ）を持つアカウントだけが入れます" },
];

/**
 * ゲームに参加できる人。イベント参加者・参加パス保有者に絞るときは、対象イベントが必要。
 * 絞った場合、参加者はログインしてから入る（スタンプラリーと同じ確かめ方）。
 */
export function AudienceField({
  value,
  onChange,
  eventChosen,
}: {
  value: GameAudienceChoice;
  onChange: (value: GameAudienceChoice) => void;
  /** 対象イベントを選んでいるか。 */
  eventChosen: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>参加できる人</span>
      <div role="radiogroup" aria-label="参加できる人" style={{ display: "grid", gap: "0.35rem" }}>
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
      {value !== "anyone" ? (
        <small style={{ fontSize: "0.72rem", lineHeight: 1.5, color: eventChosen ? "#5d6b62" : "#c0392b", fontWeight: eventChosen ? 500 : 800 }}>
          {eventChosen
            ? "参加者はログインしてから入ります。条件に合わないアカウントは入れません。"
            : "対象イベントを選んでください。選ぶまでは、誰も入れません。"}
        </small>
      ) : null}
    </div>
  );
}
