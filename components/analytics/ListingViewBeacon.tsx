"use client";

import { useEffect } from "react";

/**
 * 掲載の詳細ページが開かれたことを、主催者のダッシュボードの「閲覧数」として1回だけ知らせる。
 * 同じタブで同じページを何度開いても、1回だけ数える（sessionStorage）。主催者のプレビューは数えない。
 */
export function ListingViewBeacon({
  kind,
  id,
  disabled = false,
}: {
  kind: "event" | "store" | "recruitment";
  id: string;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (disabled || !id) return;
    const key = `mg-view:${kind}:${id}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* 保存できない環境でも数える */
    }
    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
      keepalive: true,
    }).catch(() => {});
  }, [kind, id, disabled]);
  return null;
}
