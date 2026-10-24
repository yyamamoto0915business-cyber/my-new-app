"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const card = (on: boolean) => ({
  display: "grid",
  gap: "0.5rem",
  padding: "0.6rem 0.75rem",
  border: `1.5px solid ${on ? "#9fd3b2" : "#e4ece6"}`,
  borderRadius: "0.9rem",
  background: on ? "#f4fbf6" : "#fff",
  transition: "background 0.15s, border-color 0.15s",
});

function Head({ icon: Icon, title, desc, on, children }: { icon: LucideIcon; title: string; desc: string; on: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          flex: "none",
          alignItems: "center",
          justifyContent: "center",
          width: "1.9rem",
          height: "1.9rem",
          borderRadius: "0.6rem",
          background: on ? "#1f7a4a" : "#eef3ef",
          color: on ? "#fff" : "#66726a",
        }}
      >
        <Icon style={{ width: "1rem", height: "1rem" }} />
      </span>
      <span style={{ display: "grid", gap: "0.1rem", flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: "0.88rem", color: "#1a2214", lineHeight: 1.35 }}>{title}</b>
        <small style={{ fontSize: "0.72rem", color: "#5d6b62", lineHeight: 1.45 }}>{desc}</small>
      </span>
      {children}
    </div>
  );
}

/** オン・オフのスイッチ。 */
function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        position: "relative",
        flex: "none",
        width: "2.6rem",
        height: "1.5rem",
        padding: 0,
        border: 0,
        borderRadius: 999,
        background: on ? "#1f7a4a" : "#cfd8d2",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "0.18rem",
          left: on ? "1.28rem" : "0.18rem",
          width: "1.14rem",
          height: "1.14rem",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.25)",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

/** クリアの条件（数を選ぶ）。いつもオン。 */
export function ClearCountCard({
  icon,
  title,
  desc,
  value,
  max,
  unit,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  value: number;
  max: number;
  /** 選択肢の後ろに付ける言葉（「問」「問以上」など）。 */
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div style={card(true)}>
      <Head icon={icon} title={title} desc={desc} on>
        <select
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={title}
          style={{
            flex: "none",
            minHeight: "2rem",
            padding: "0 0.5rem",
            border: "1px solid #cfe3d6",
            borderRadius: "0.6rem",
            background: "#fff",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {Array.from({ length: Math.max(max, 1) }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count}
              {unit}
            </option>
          ))}
        </select>
      </Head>
    </div>
  );
}

/** 特典などの、スイッチで入れる項目。オンのときだけ、中身の入力欄を同じカードの中に出す。 */
export function RewardCard({
  icon,
  title,
  desc,
  on,
  onChange,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  on: boolean;
  onChange: (on: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div style={card(on)}>
      <Head icon={icon} title={title} desc={desc} on={on}>
        <Switch on={on} label={title} onChange={onChange} />
      </Head>
      {on && children ? <div style={{ paddingTop: "0.5rem", borderTop: "1px dashed #cfe3d6" }}>{children}</div> : null}
    </div>
  );
}

/** カードを縦に並べる。 */
export function RewardList({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.7rem" }}>{children}</div>;
}
