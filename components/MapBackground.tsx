"use client";

import { usePathname } from "next/navigation";
import { isAuthRoute } from "@/lib/is-auth-route";

/**
 * サイト全体の白い高級紙背景（紙色＋グレイン）
 *
 * 以前はここに「靴の足あと」の SVG を重ねていたが、場所の指定が効かずに
 * いつも左上に黒い形が出ていた（左メニューが出る前に見えてしまう）ので外した。
 */
export function MapBackground() {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      aria-hidden
    >
      {/* 白い高級感のある紙（地図なし） */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--mg-paper)" }}
      />

      {/* 高級感グレイン（紙質ノイズ・控えめ） */}
      <div
        className="pointer-events-none absolute inset-0 z-[0] mix-blend-multiply dark:mix-blend-overlay opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage: `repeating-conic-gradient(
            var(--mg-ink) 0% 0.25%,
            transparent 0% 0.5%
          )`,
          backgroundSize: "2px 2px",
        }}
      />
    </div>
  );
}
