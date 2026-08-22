"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";

export type PostMutation =
  | { status: MyPostItem["status"] }
  | { deleted: true };

type Props = {
  post: MyPostItem;
  onMutated?: (id: string, change: PostMutation) => void;
  /** カード上部など、上方向に開くと隠れる場合は down */
  popDirection?: "up" | "down";
};

/** デモ投稿はサーバに存在しないため、API を呼ばずローカルだけ更新する */
function isDemoPost(id: string): boolean {
  return id.startsWith("demo-");
}

export function PostCardMenu({ post, onMutated, popDirection = "up" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const isPublic = post.status === "public";
  const isHidden = post.status === "hidden";
  const isDraft = post.status === "draft";

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const patchStatus = useCallback(
    async (status: MyPostItem["status"]) => {
      if (busy) return;
      setBusy(true);
      try {
        if (!isDemoPost(post.id)) {
          const res = await fetch(`/api/me/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(j.error ?? "更新に失敗しました");
          }
        }
        onMutated?.(post.id, { status });
        setOpen(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "更新に失敗しました");
      } finally {
        setBusy(false);
      }
    },
    [busy, post.id, onMutated],
  );

  const handleDelete = useCallback(async () => {
    if (busy) return;
    if (!window.confirm("この投稿を削除しますか？この操作は取り消せません。")) {
      return;
    }
    setBusy(true);
    try {
      if (!isDemoPost(post.id)) {
        const res = await fetch(`/api/me/posts/${post.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "削除に失敗しました");
        }
      }
      onMutated?.(post.id, { deleted: true });
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  }, [busy, post.id, onMutated]);

  return (
    <div className="post-card-menu" ref={wrapRef} data-no-swipe>
      <button
        type="button"
        className="my-album-card__more"
        aria-label="投稿の操作メニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <MoreVertical className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      {open && (
        <div
          className={`post-card-menu__pop${popDirection === "down" ? " post-card-menu__pop--down" : ""}`}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="post-card-menu__item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              // 下書きは作成フォームで続きから編集する
              router.push(
                post.status === "draft"
                  ? `/posts/new?draft=${post.id}`
                  : `/posts/${post.id}/edit`,
              );
            }}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            編集
          </button>

          {isPublic ? (
            <button
              type="button"
              role="menuitem"
              className="post-card-menu__item"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                patchStatus("hidden");
              }}
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
              非公開にする
            </button>
          ) : null}

          {isHidden || isDraft ? (
            <button
              type="button"
              role="menuitem"
              className="post-card-menu__item"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                patchStatus("public");
              }}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              公開する
            </button>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className="post-card-menu__item post-card-menu__item--danger"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            削除
          </button>
        </div>
      )}
    </div>
  );
}
