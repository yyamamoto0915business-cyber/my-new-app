"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Plus, Store, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import {
  isOwnManageableStore,
  organizerPathForKind,
} from "@/lib/stores/draft-shell";
import {
  formatStoreDateJa,
  type StoreKind,
  type StoreRecord,
  type StoreStatus,
} from "@/lib/stores/types";

function statusLabel(status: StoreStatus): string {
  switch (status) {
    case "public":
      return "公開中";
    case "private":
      return "非公開";
    case "draft":
      return "下書き";
  }
}

function statusClass(status: StoreStatus): string {
  switch (status) {
    case "public":
      return "bg-[#E8F5EC] text-[#2D7A4F]";
    case "private":
      return "bg-[#f0f2f0] text-[#6a7468]";
    case "draft":
      return "bg-[#FFF5EE] text-[#C45C12]";
  }
}

type Props = {
  kind?: StoreKind;
};

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function OrganizerStoresList({ kind = "store" }: Props) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isKitchen = kind === "kitchen_car";
  const basePath = organizerPathForKind(kind);
  const label = isKitchen ? "キッチンカー" : "店舗";
  const ListIcon = isKitchen ? Truck : Store;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/stores?kind=${encodeURIComponent(kind)}`,
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "一覧の取得に失敗しました");
          return;
        }
        if (!cancelled) {
          const list = ((json.stores as StoreRecord[]) ?? []).filter(
            isOwnManageableStore,
          );
          setStores(list);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(
            "一覧の取得がタイムアウトしました。再読み込みするか、「作成」から追加してください。",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <div className="space-y-4">
      <OrganizerWorkspacePageHeader
        title={`${label}管理`}
        subtitle={`掲載中の${label}を一覧で確認・編集できます。`}
        compact
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/organizer/listings"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d5e2d8] bg-white px-3 py-2 text-[12px] font-semibold text-[#2D7A4F] transition hover:bg-[#f4f8f4]"
            >
              掲載管理
            </Link>
            <Link
              href={`${basePath}/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D7A4F] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#245f3e]"
            >
              <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
              {label}を作成
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-3 min-[900px]:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-[#e4ede0]"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#f0d0c8] bg-[#FFF5F2] px-4 py-3 text-[13px] text-[#b42318]">
          {error}
        </p>
      ) : null}

      {!loading && !error && stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c8d8cc] bg-white px-6 py-12 text-center">
          <ListIcon className="mx-auto size-8 text-[#9aa89e]" strokeWidth={1.6} aria-hidden />
          <p className="mt-3 text-[14px] font-semibold text-[#1a2214]">
            まだ{label}がありません
          </p>
          <p className="mt-1 text-[13px] text-[#6a7468]">
            最初の{label}を作成して、紹介やニュースを掲載しましょう。
          </p>
          <Link
            href={`${basePath}/new`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#2D7A4F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#245f3e]"
          >
            <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
            {label}を作成
          </Link>
        </div>
      ) : null}

      {!loading && stores.length > 0 ? (
        <ul className="grid gap-3 min-[900px]:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`${basePath}/${store.id}`}
                className="group flex overflow-hidden rounded-2xl border border-[#d5e2d8] bg-white transition hover:border-[#9fb8a4] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="relative h-[7.5rem] w-[6.5rem] shrink-0 bg-[#e8eee9] min-[900px]:h-auto min-[900px]:w-36">
                  {store.coverImageUrl ? (
                    <Image
                      src={store.coverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#9aa89e]">
                      <ListIcon className="size-7" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3.5">
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                          statusClass(store.status),
                        )}
                      >
                        {statusLabel(store.status)}
                      </span>
                      {store.category ? (
                        <span className="text-[11px] font-medium text-[#7a857c]">
                          {store.category}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="truncate text-[15px] font-bold text-[#1a2214]">
                      {store.name}
                    </h2>
                    {store.tagline ? (
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#6a7468]">
                        {store.tagline}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8a948c]">
                      更新 {formatStoreDateJa(store.updatedAt)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#2D7A4F] group-hover:underline">
                      管理する
                      <ChevronRight className="size-3.5" strokeWidth={2.4} />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
