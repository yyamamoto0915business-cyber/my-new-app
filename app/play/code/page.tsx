"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

/** 参加コードを入れて、ゲームに参加する（QR を読めないとき）。 */
export default function PlayCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 参加パスの「コードを入れて始める」から来たときは、コードを入れておく。
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("code");
    if (fromUrl) setCode((current) => current || fromUrl.slice(0, 12));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || code.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/play/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { joinPath?: string; error?: string };
      if (!res.ok || !json.joinPath) {
        setError(json.error ?? "参加コードが見つかりません");
        return;
      }
      router.push(json.joinPath);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="play-game">
      <div className="play-game__card" style={{ display: "grid", gap: "0.8rem" }}>
        <span className="play-game__icon" aria-hidden style={{ justifySelf: "center" }}>
          <KeyRound />
        </span>
        <h1>参加コードで参加</h1>
        <p className="play-game__desc">会場の掲示や主催者から聞いた、6文字の参加コードを入れてください。</p>
        <form onSubmit={(event) => void submit(event)} style={{ display: "grid", gap: "0.6rem" }}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            placeholder="例：K7Q2MX"
            aria-label="参加コード"
            style={{
              minHeight: "3.2rem",
              padding: "0 1rem",
              border: "1.5px solid #d5e2d8",
              borderRadius: "0.9rem",
              background: "#fbfdfb",
              fontSize: "1.4rem",
              fontWeight: 800,
              letterSpacing: "0.3em",
              textAlign: "center",
            }}
          />
          {error ? <p className="play-join__error">{error}</p> : null}
          <button type="submit" className="play-dock__go" disabled={busy || code.trim().length < 4}>
            {busy ? "探しています…" : "参加する"}
          </button>
        </form>
      </div>
    </main>
  );
}
