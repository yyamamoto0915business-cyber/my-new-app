"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/** ワードの「テーマの色」の元になる10色。 */
const THEME_BASE = ["#ffffff", "#000000", "#e7e6e6", "#44546a", "#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];
/** ワードの「標準の色」。 */
const STANDARD = ["#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0"];
/** この画面になじむ、よく使う色。 */
const APP_COLORS = ["#1d2a22", "#1f7a4a", "#d9452b", "#f08a24", "#f2b233", "#2f7cf6", "#8b5cf6", "#ec5f8c", "#fff4d6", "#eef7f1"];

function mix(hex: string, target: number, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** テーマの色の段（いちばん上が元の色、下へ明るく・暗く）。白と黒は、ワードと同じく片側だけに振る。 */
function themeColumn(base: string): string[] {
  if (base === "#ffffff") return [base, mix(base, 0, 0.05), mix(base, 0, 0.15), mix(base, 0, 0.35), mix(base, 0, 0.5)];
  if (base === "#000000") return [base, mix(base, 255, 0.5), mix(base, 255, 0.35), mix(base, 255, 0.2), mix(base, 255, 0.1)];
  return [base, mix(base, 255, 0.8), mix(base, 255, 0.5), mix(base, 0, 0.25), mix(base, 0, 0.5)];
}
const THEME_ROWS = THEME_BASE.map(themeColumn);

function Chip({ color, on, onPick }: { color: string; on: boolean; onPick: (color: string) => void }) {
  return (
    <button
      type="button"
      title={color}
      aria-label={color}
      aria-pressed={on}
      onClick={() => onPick(color)}
      style={{
        width: "0.95rem",
        height: "0.95rem",
        padding: 0,
        border: on ? "2px solid #1f7a4a" : "1px solid rgba(0, 0, 0, 0.12)",
        borderRadius: 2,
        background: color,
        boxShadow: on ? "0 0 0 1.5px #fff inset" : undefined,
        cursor: "pointer",
      }}
    />
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(10, 0.95rem)", gap: "2px" } as const;

/**
 * ワードの「フォントの色」のような色選び。押すと、テーマの色・標準の色・よく使う色・その他の色（自由に選ぶ）が開く。
 * 値は #rrggbb。空は「もとの色」「なし」。
 */
export function ColorPalette({
  label,
  value,
  emptyLabel,
  onChange,
  open,
  onOpen,
}: {
  label: string;
  value: string;
  /** 空を選ぶボタンの文字（「もとの色」「なし」）。 */
  emptyLabel: string;
  onChange: (color: string) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const [custom, setCustom] = useState(value || "#1f7a4a");
  const pick = (color: string) => {
    onChange(color);
    onOpen(false);
  };
  return (
    <div style={{ display: "grid", gap: "0.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ flex: "none", width: "3rem", fontSize: "0.7rem", fontWeight: 800, color: "#3c4a40" }}>{label}</span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpen(!open)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            minHeight: "1.8rem",
            padding: "0 0.55rem 0 0.35rem",
            border: "1px solid #dfe7e1",
            borderRadius: 8,
            background: "#fff",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#3c4a40",
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden
            style={{
              width: "1.2rem",
              height: "1.2rem",
              borderRadius: 4,
              border: "1px solid rgba(0, 0, 0, 0.15)",
              background: value || "repeating-linear-gradient(45deg, #fff 0 4px, #e5e9e6 4px 8px)",
            }}
          />
          {value ? value.toUpperCase() : emptyLabel}
          <ChevronDown aria-hidden style={{ width: "0.85rem", height: "0.85rem" }} />
        </button>
      </div>
      {open ? (
        <div style={{ width: "fit-content", padding: "0.3rem 0.4rem 0.4rem", border: "1px solid #e4ebe6", borderRadius: 8, background: "#fbfcfb" }}>
          {/* いちばん上の1行に、「もとの色」と「その他の色」をまとめる。見出しは出さず、縦を詰める。 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem", marginBottom: "0.3rem" }}>
            <button
              type="button"
              onClick={() => pick("")}
              style={{
                minHeight: "1.3rem",
                padding: "0 0.5rem",
                border: "1px solid #dfe7e1",
                borderRadius: 5,
                background: value ? "#fff" : "#eef7f1",
                fontSize: "0.64rem",
                fontWeight: 700,
                color: "#3c4a40",
                cursor: "pointer",
              }}
            >
              {emptyLabel}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.62rem", fontWeight: 700, color: "#3c4a40" }}>
              その他
              <input
                type="color"
                value={custom}
                onChange={(event) => {
                  setCustom(event.target.value);
                  onChange(event.target.value);
                }}
                style={{ width: "1.6rem", height: "1.1rem", padding: 0, border: "1px solid #dfe7e1", borderRadius: 4, background: "none", cursor: "pointer" }}
              />
            </label>
          </div>
          <div style={grid} title="テーマの色">
            {/* 横に元の色、縦に明るさを並べる（ワードと同じ並び）。 */}
            {Array.from({ length: 5 }, (_, row) =>
              THEME_ROWS.map((column) => <Chip key={`${row}-${column[0]}`} color={column[row]!} on={value === column[row]} onPick={pick} />),
            )}
          </div>
          <div style={{ ...grid, marginTop: "0.3rem" }} title="標準の色・よく使う色">
            {[...STANDARD, ...APP_COLORS].map((color) => (
              <Chip key={color} color={color} on={value === color} onPick={pick} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
