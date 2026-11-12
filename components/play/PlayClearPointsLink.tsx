"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayCopy } from "@/components/play/usePlayCopy";

/** /play/<token> のときだけ token を返す */
function tokenFromPath(pathname: string | null): string | null {
  const m = pathname?.match(/^\/play\/([^/]+)\/?$/);
  if (!m) return null;
  const t = decodeURIComponent(m[1]);
  return t === "code" || t === "preview" || t === "spot" ? null : t;
}

/**
 * クリアしてポイントを受け取ったあとに出すリンク。
 * そのイベントが開催中で「商品と交換」なら「会場のレジで交換できます」と、レジで見せるQRへのリンクを出す。
 * そうでなければ、今までどおり「マイポイントを見る」。
 */
export function PlayClearPointsLink({ gameToken }: { gameToken?: string }) {
  const copy = usePlayCopy();
  const pathToken = tokenFromPath(usePathname());
  const token = gameToken || pathToken;
  const [exchange, setExchange] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/play/${encodeURIComponent(token)}/points`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { exchange?: boolean } | null) => {
        if (!cancelled) setExchange(Boolean(json?.exchange));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!exchange) {
    return (
      <Link className="play-join__login" href="/points">
        {copy.seePoints}
      </Link>
    );
  }
  return (
    <>
      <p className="play-clear__code-note">{copy.pointsAtRegister}</p>
      <Link className="play-join__login" href="/points#qr">
        {copy.showRegisterQr}
      </Link>
    </>
  );
}
