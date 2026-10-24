import type { ReactNode } from "react";
import { Gift } from "lucide-react";

/**
 * クリアの画面に出す特典（クーポン・景品など）。はじめから目立つよう、色の付いた札にして出す。
 * 「順位は〜」などの案内は、控えめな文字のまま。
 */
export function RewardLine({ text, children }: { text: string; children?: ReactNode }) {
  if (text.startsWith("順位")) {
    return <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#5d6b62" }}>{children ?? text}</p>;
  }
  return (
    <p
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        margin: "0.6rem 0 0",
        padding: "0.8rem 0.95rem",
        border: "2px solid #f2b233",
        borderRadius: "1rem",
        background: "linear-gradient(135deg, #fff6dc 0%, #ffe9b0 100%)",
        boxShadow: "0 6px 16px rgba(196, 128, 18, 0.18)",
        color: "#6b3d00",
        fontSize: "1rem",
        fontWeight: 900,
        lineHeight: 1.45,
        textAlign: "left",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          flex: "none",
          alignItems: "center",
          justifyContent: "center",
          width: "2.2rem",
          height: "2.2rem",
          borderRadius: "50%",
          background: "#f2b233",
          color: "#fff",
        }}
      >
        <Gift style={{ width: "1.2rem", height: "1.2rem" }} />
      </span>
      <span>{children ?? text}</span>
    </p>
  );
}
