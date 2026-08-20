"use client";

import { OrganizerStoresList } from "@/components/organizer/stores/OrganizerStoresList";
import type { StoreKind } from "@/lib/stores/types";

type Props = {
  kind?: StoreKind;
};

/**
 * 店舗 / キッチンカー入口。
 * 自動作成・自動遷移はせず一覧をすぐ出す（ローディング固着を避ける）。
 */
export function OrganizerStoresEntry({ kind = "store" }: Props) {
  return <OrganizerStoresList kind={kind} />;
}
