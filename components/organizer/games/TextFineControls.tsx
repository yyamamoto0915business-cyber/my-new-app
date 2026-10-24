"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold } from "lucide-react";
import { Choice } from "@/components/organizer/games/StartLookToolbar";
import { ColorPalette } from "@/components/organizer/games/ColorPalette";
import { FINE_DEFAULT, FINE_FONTS, FINE_FONT_LABEL, type GameLookFine } from "@/lib/organizer/game-look";
import { cn } from "@/lib/utils";

type Tab = "font" | "color" | "effect" | "layout";
const TABS: { id: Tab; label: string }[] = [
  { id: "font", label: "文字" },
  { id: "color", label: "色" },
  { id: "effect", label: "効果" },
  { id: "layout", label: "配置" },
];

const wrap: CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: 0, width: "100%" };
const tabBar: CSSProperties = { display: "flex", gap: "0.25rem", padding: "0.15rem", paddingRight: "2.6rem", borderRadius: "0.7rem", background: "#f1f5f2", alignItems: "center" };

/** 細かい調整の中だけ、ボタンや見本を小さくして、パネルを低くする。 */
const COMPACT_CSS = `
.fine-ctl .edit-panel__choice { min-height: 1.65rem; padding: 0 0.5rem; font-size: 0.7rem; gap: 0.2rem; }
.fine-ctl .edit-panel__choice svg { width: 0.85rem; height: 0.85rem; }
.fine-ctl .edit-panel__swatch { width: 1.4rem; height: 1.4rem; }
`;

/**
 * 細かい調整のパネルは、スマホでも横一列の帯にせず、縦に積んで中でスクロールさせる。
 * （帯用の指定に負けないよう、style で直接指定する）
 */
export const FINE_PANEL_STYLE: CSSProperties = {
  position: "relative",
  display: "block",
  maxHeight: "min(28dvh, 15rem)",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "0.4rem 0.6rem 0.5rem",
  borderRadius: "1rem",
};
/** 見出しは出さず、閉じるボタンだけをタブの行の右端に重ねる（その分、パネルが低くなる）。 */
export const FINE_HEAD_STYLE: CSSProperties = {
  position: "absolute",
  top: "0.3rem",
  right: "0.4rem",
  zIndex: 2,
  margin: 0,
  display: "flex",
};
export const FINE_ROWS_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "0.35rem",
  overflow: "visible",
  WebkitMaskImage: "none",
  maskImage: "none",
};

/** ラベル＋選択肢の行。色の見本が多いので、はみ出さず折り返す。 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
      <span style={{ flex: "none", width: "3rem", paddingTop: "0.3rem", fontSize: "0.7rem", fontWeight: 800, color: "#3c4a40" }}>
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", minWidth: 0, flex: 1 }}>{children}</div>
    </div>
  );
}

/** ワード・パワポのように、数字を動かして細かく合わせる行。 */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  initial,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  initial: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 0, minWidth: 0, fontSize: "0.7rem", fontWeight: 800, color: "#3c4a40" }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: "0.3rem" }}>
        {label}
        <output style={{ color: "#66726a", fontVariantNumeric: "tabular-nums" }}>
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onDoubleClick={() => onChange(initial)}
        style={{ width: "100%", minWidth: 0, margin: 0, accentColor: "#1f7a4a", height: "1.15rem" }}
      />
    </label>
  );
}

/** スライダーは2列に並べて、縦を節約する。 */
const SLIDER_GRID: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 0.9rem" };

/**
 * 文字の細かい調整（大きさ・字間・行間・フォント・色・影・光彩・縁取り・揃え）。
 * 上の部分の文字と、足したテキストの両方で使う。ダブルタップ（ダブルクリック）で、スライダーをはじめの値に戻せる。
 */
export function TextFineControls({
  value,
  color,
  bg,
  onFine,
  onColor,
  onBg,
  colorOriginalLabel,
}: {
  value: GameLookFine;
  color: string;
  bg: string;
  onFine: (patch: Partial<GameLookFine>) => void;
  onColor: (color: string) => void;
  onBg: (bg: string) => void;
  /** 渡すと、文字の色に「もとの色」の選択肢を出す。 */
  colorOriginalLabel?: string;
}) {
  const [tab, setTab] = useState<Tab>("font");
  /** 開いている色選び（ひとつだけ）。 */
  const [palette, setPalette] = useState<string | null>(null);
  const paletteProps = (id: string) => ({ open: palette === id, onOpen: (open: boolean) => setPalette(open ? id : null) });
  const reset = () => onFine({ ...FINE_DEFAULT, glow: "", stroke: "", bold: false });
  return (
    <div style={wrap} className="fine-ctl">
      <style>{COMPACT_CSS}</style>
      <div style={tabBar} role="tablist" aria-label="文字の調整">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn("edit-panel__choice", tab === item.id && "is-on")}
            style={{ flex: 1, justifyContent: "center", minHeight: "1.8rem" }}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="edit-panel__choice"
          style={{ flex: "none", border: 0, background: "none", color: "#8a968e", textDecoration: "underline" }}
          title="書式をもとに戻す"
          onClick={reset}
        >
          リセット
        </button>
      </div>

      {tab === "font" ? (
        <>
          <Row label="書体">
            {FINE_FONTS.map((id) => (
              <Choice key={id} on={value.font === id} onClick={() => onFine({ font: id })} label={FINE_FONT_LABEL[id]} />
            ))}
            <Choice on={value.bold} onClick={() => onFine({ bold: !value.bold })} label="太字">
              <Bold aria-hidden />
            </Choice>
          </Row>
          <div style={SLIDER_GRID}>
          <Slider label="大きさ" value={value.scale} min={40} max={300} step={5} unit="%" initial={100} onChange={(scale) => onFine({ scale })} />
          <Slider label="字間" value={value.spacing} min={-10} max={50} unit="" initial={0} onChange={(spacing) => onFine({ spacing })} />
          <Slider label="行間" value={value.leading} min={0} max={300} step={5} unit={value.leading ? "%" : ""} initial={0} onChange={(leading) => onFine({ leading })} />
          <Slider label="透明度" value={value.opacity} min={10} max={100} step={5} unit="%" initial={100} onChange={(opacity) => onFine({ opacity })} />
          </div>
        </>
      ) : null}

      {tab === "color" ? (
        <>
          <ColorPalette label="文字" value={color} emptyLabel={colorOriginalLabel ?? "もとの色"} onChange={onColor} {...paletteProps("color")} />
          <ColorPalette label="背景" value={bg} emptyLabel="なし" onChange={onBg} {...paletteProps("bg")} />
        </>
      ) : null}

      {tab === "effect" ? (
        <>
          <Row label="影">
            <Choice on={value.shadowAlpha === 0} onClick={() => onFine({ shadowAlpha: 0 })} label="なし" />
            <Choice
              on={value.shadowAlpha > 0}
              onClick={() => onFine({ shadowAlpha: value.shadowAlpha > 0 ? value.shadowAlpha : 45 })}
              label="あり"
            />
          </Row>
          {value.shadowAlpha > 0 ? (
            <div style={SLIDER_GRID}>
              <Slider label="横" value={value.shadowX} min={-20} max={20} unit="px" initial={FINE_DEFAULT.shadowX} onChange={(shadowX) => onFine({ shadowX })} />
              <Slider label="縦" value={value.shadowY} min={-20} max={20} unit="px" initial={FINE_DEFAULT.shadowY} onChange={(shadowY) => onFine({ shadowY })} />
              <Slider label="ぼかし" value={value.shadowBlur} min={0} max={30} unit="px" initial={FINE_DEFAULT.shadowBlur} onChange={(shadowBlur) => onFine({ shadowBlur })} />
              <Slider label="濃さ" value={value.shadowAlpha} min={5} max={100} step={5} unit="%" initial={45} onChange={(shadowAlpha) => onFine({ shadowAlpha })} />
            </div>
          ) : null}
          <ColorPalette label="光彩" value={value.glow} emptyLabel="なし" onChange={(glow) => onFine({ glow })} {...paletteProps("glow")} />
          {value.glow ? (
            <Slider label="広がり" value={value.glowSize} min={2} max={40} unit="px" initial={FINE_DEFAULT.glowSize} onChange={(glowSize) => onFine({ glowSize })} />
          ) : null}
          <ColorPalette label="縁取り" value={value.stroke} emptyLabel="なし" onChange={(stroke) => onFine({ stroke })} {...paletteProps("stroke")} />
          {value.stroke ? (
            <Slider label="太さ" value={value.strokeWidth} min={0.5} max={8} step={0.5} unit="px" initial={FINE_DEFAULT.strokeWidth} onChange={(strokeWidth) => onFine({ strokeWidth })} />
          ) : null}
        </>
      ) : null}

      {tab === "layout" ? (
        <>
          <Row label="揃え">
            <Choice on={!value.align} onClick={() => onFine({ align: "" })} label="そのまま" />
            <Choice on={value.align === "left"} onClick={() => onFine({ align: "left" })} label="左">
              <AlignLeft aria-hidden />
            </Choice>
            <Choice on={value.align === "center"} onClick={() => onFine({ align: "center" })} label="中央">
              <AlignCenter aria-hidden />
            </Choice>
            <Choice on={value.align === "right"} onClick={() => onFine({ align: "right" })} label="右">
              <AlignRight aria-hidden />
            </Choice>
          </Row>
        </>
      ) : null}

    </div>
  );
}
