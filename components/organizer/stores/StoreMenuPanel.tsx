"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreMenuEditForm } from "@/components/organizer/stores/StoreMenuEditForm";
import { formatStoreDateJa, type StoreMenuRecord } from "@/lib/stores/types";

type Props = {
  storeId: string;
  menu: StoreMenuRecord[];
  onMenuChange: (menu: StoreMenuRecord[]) => void;
};

export function StoreMenuPanel({ storeId, menu, onMenuChange }: Props) {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editing =
    editingId != null ? (menu.find((m) => m.id === editingId) ?? null) : null;

  async function handleDelete(menuId: string) {
    if (!window.confirm("このメニューを削除しますか？")) return;
    setDeletingId(menuId);
    try {
      const res = await fetch(`/api/organizer/stores/${storeId}/menu/${menuId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onMenuChange(menu.filter((m) => m.id !== menuId));
        if (editingId === menuId) {
          setMode("list");
          setEditingId(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (mode === "create" || (mode === "edit" && editing)) {
    return (
      <section className="org-store-mgmt__panel" aria-labelledby="store-menu-form-heading">
        <StoreMenuEditForm
          storeId={storeId}
          initial={mode === "edit" ? editing : null}
          onCancel={() => {
            setMode("list");
            setEditingId(null);
          }}
          onSaved={(saved) => {
            if (mode === "edit") {
              onMenuChange(menu.map((m) => (m.id === saved.id ? saved : m)));
            } else {
              onMenuChange([saved, ...menu.filter((m) => m.id !== saved.id)]);
            }
            setMode("list");
            setEditingId(null);
          }}
        />
      </section>
    );
  }

  return (
    <section className="org-store-mgmt__panel" aria-labelledby="store-menu-heading">
      <div className="org-store-mgmt__panel-head">
        <h2 id="store-menu-heading" className="org-store-mgmt__panel-title">
          メニュー・商品
        </h2>
        <button
          type="button"
          className="org-store-mgmt__create-btn"
          onClick={() => {
            setMode("create");
            setEditingId(null);
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
          メニューを追加
        </button>
      </div>

      {menu.length === 0 ? (
        <p className="org-store-mgmt__empty-cell py-8 text-center">
          まだメニューがありません。「メニューを追加」から登録できます。
        </p>
      ) : (
        <ul className="org-store-menu-list">
          {menu.map((item) => (
            <li key={item.id} className="org-store-menu-list__item">
              <div className="org-store-menu-list__thumb">
                <Image
                  src={
                    item.imageUrl ||
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80"
                  }
                  alt=""
                  width={54}
                  height={54}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="org-store-menu-list__body">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "org-store-mgmt__news-status shrink-0",
                      item.status === "public" && "is-public",
                    )}
                  >
                    {item.status === "public" ? "公開" : "下書き"}
                  </span>
                  <strong className="truncate text-[12.5px] font-bold leading-snug text-[#1a2214]">
                    {item.name}
                  </strong>
                </div>
                {item.description ? (
                  <p className="line-clamp-1 text-[11px] leading-snug text-[#7a857c]">
                    {item.description}
                  </p>
                ) : null}
                <p className="truncate text-[12.5px] font-bold leading-snug text-[#2D7A4F]">
                  ¥{item.priceYen.toLocaleString("ja-JP")}
                  <span className="ml-1.5 text-[10.5px] font-normal text-[#8a948c]">
                    更新 {formatStoreDateJa(item.updatedAt)}
                  </span>
                </p>
              </div>
              <div className="org-store-menu-list__actions">
                <button
                  type="button"
                  className="org-store-mgmt__text-action inline-flex items-center gap-1"
                  onClick={() => {
                    setEditingId(item.id);
                    setMode("edit");
                  }}
                >
                  <Pencil className="size-3" strokeWidth={2.2} aria-hidden />
                  編集
                </button>
                <button
                  type="button"
                  className="org-store-mgmt__icon-action"
                  disabled={deletingId === item.id}
                  aria-label="削除"
                  onClick={() => void handleDelete(item.id)}
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
