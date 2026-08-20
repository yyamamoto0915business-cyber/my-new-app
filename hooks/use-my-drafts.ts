"use client";

import { useCallback, useEffect, useState } from "react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import type { PostMutation } from "@/components/profile/posts/PostCardMenu";

export type MyDraftsState = {
  drafts: MyPostItem[];
  loaded: boolean;
  applyMutation: (id: string, change: PostMutation) => void;
};

/**
 * 自分の下書き一覧を取得する。reloadToken が変化すると再取得する。
 * 取得を1か所に集約し、ヘッダーボタンとサイドバーで共有する。
 */
export function useMyDrafts(reloadToken?: number): MyDraftsState {
  const [drafts, setDrafts] = useState<MyPostItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/posts")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: MyPostItem[] }) => {
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setDrafts(items.filter((p) => p.status === "draft"));
      })
      .catch(() => {
        if (!cancelled) setDrafts([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const applyMutation = useCallback((id: string, change: PostMutation) => {
    setDrafts((prev) => {
      if ("deleted" in change) return prev.filter((p) => p.id !== id);
      // 下書き以外の状態になったら一覧から外す
      if (change.status !== "draft") return prev.filter((p) => p.id !== id);
      return prev;
    });
  }, []);

  return { drafts, loaded, applyMutation };
}
