"use client";

import type { ReactNode } from "react";

export function GameTestSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="game-test" role="dialog" aria-modal="true" aria-label="お試しプレイ">
      <div className="game-test__sheet">
        <div className="game-test__bar">
          <p>お試しです。記録や特典の付与はされません。</p>
          <button type="button" onClick={onClose}>
            閉じる
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
