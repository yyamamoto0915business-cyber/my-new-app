"use client";

import { useState } from "react";

/**
 * 参加コード：QR を読めない人が、アプリの「参加コードで参加」に入れて参加する。主催者は掲示や口頭で伝える。
 * 編集画面の「参加のしかた」の中に、QR の下の小さな区切りとして置く。
 */
export function GameJoinCodePanel({ gameId, published }: { gameId: string; published: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function show() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/join-code`, { method: "POST" });
      const json = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !json.code) {
        setError(json.error ?? "参加コードを出せませんでした");
        return;
      }
      setCode(json.code);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: "0.9rem", borderTop: "1px dashed #d9eadf", paddingTop: "0.85rem" }}>
      <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1a4d32" }}>参加コード</h3>
      <p style={{ margin: "0.25rem 0 0.7rem", fontSize: "0.75rem", lineHeight: 1.6, color: "#6a7568" }}>
        参加する人は、まちの情報の「参加コードを持っている方はこちら」から、この6文字を入れます。
        {published ? "" : "（公開すると使えます）"}
      </p>
      {code ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
          <b style={{ fontSize: "2rem", letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", color: "#1a2214" }}>{code}</b>
          <button
            type="button"
            className="org-game-editor__reset"
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
      ) : (
        <button type="button" className="org-game-editor__reset" disabled={busy} onClick={() => void show()}>
          {busy ? "用意しています…" : "参加コードを表示する"}
        </button>
      )}
      {error ? <p className="org-game-editor__note">{error}</p> : null}
    </div>
  );
}
