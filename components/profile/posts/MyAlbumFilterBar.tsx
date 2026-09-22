"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { POST_CATEGORY_TABS } from "@/lib/posts/mock-feed";
import type {
  AlbumCategoryFilter,
  AlbumSortKey,
  AlbumStatusFilter,
} from "@/lib/posts/my-album-view";
import { cn } from "@/lib/utils";

function FilterMenu({
  label,
  valueLabel,
  icon,
  children,
}: {
  label: string;
  valueLabel: string;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mg-album-filter" ref={wrapRef}>
      <button
        type="button"
        className={cn("mg-album-filter__btn", open && "is-open")}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span>{valueLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
      {open ? (
        <div className="mg-album-filter__menu" role="listbox" aria-label={label}>
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

const SORT_OPTIONS: { value: AlbumSortKey; label: string }[] = [
  { value: "new", label: "新しい順" },
  { value: "old", label: "古い順" },
  { value: "likes", label: "いいね順" },
];

export function MyAlbumFilterBar({
  category,
  onCategory,
  sort,
  onSort,
  year,
  years,
  onYear,
  status,
  onStatus,
  hideDrafts,
}: {
  category: AlbumCategoryFilter;
  onCategory: (next: AlbumCategoryFilter) => void;
  sort: AlbumSortKey;
  onSort: (next: AlbumSortKey) => void;
  year: number | "all";
  years: number[];
  onYear: (next: number | "all") => void;
  status: AlbumStatusFilter;
  onStatus: (next: AlbumStatusFilter) => void;
  hideDrafts?: boolean;
}) {
  const categoryLabel =
    POST_CATEGORY_TABS.find((tab) => tab.key === category)?.label ?? "すべて";
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "新しい順";
  const yearLabel = year === "all" ? "すべての年" : `${year}年`;
  const statusLabel =
    status === "all"
      ? "公開状態"
      : status === "public"
        ? "公開"
        : status === "hidden"
          ? "非公開"
          : "下書き";
  const filterSummary =
    year === "all" && status === "all" ? "絞り込み" : `${yearLabel} · ${statusLabel}`;

  return (
    <div className="mg-album-filters">
      <FilterMenu label="種類" valueLabel={categoryLabel}>
        {(close) =>
          POST_CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="option"
              aria-selected={category === tab.key}
              className={cn(category === tab.key && "is-active")}
              onClick={() => {
                onCategory(tab.key);
                close();
              }}
            >
              {tab.label}
            </button>
          ))
        }
      </FilterMenu>

      <FilterMenu
        label="絞り込み"
        valueLabel={filterSummary}
        icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
      >
        {(close) => (
          <>
            <p className="mg-album-filter__group">年</p>
            <button
              type="button"
              role="option"
              aria-selected={year === "all"}
              className={cn(year === "all" && "is-active")}
              onClick={() => {
                onYear("all");
                close();
              }}
            >
              すべての年
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="option"
                aria-selected={year === y}
                className={cn(year === y && "is-active")}
                onClick={() => {
                  onYear(y);
                  close();
                }}
              >
                {y}年
              </button>
            ))}
            <p className="mg-album-filter__group">公開</p>
            {(
              [
                { value: "all", label: "すべて" },
                { value: "public", label: "公開" },
                { value: "hidden", label: "非公開" },
                ...(hideDrafts ? [] : [{ value: "draft" as const, label: "下書き" }]),
              ] as { value: AlbumStatusFilter; label: string }[]
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={status === item.value}
                className={cn(status === item.value && "is-active")}
                onClick={() => {
                  onStatus(item.value);
                  close();
                }}
              >
                {item.label}
              </button>
            ))}
          </>
        )}
      </FilterMenu>

      <FilterMenu
        label="並び順"
        valueLabel={sortLabel}
        icon={<ArrowUpDown className="h-3.5 w-3.5" />}
      >
        {(close) =>
          SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={sort === option.value}
              className={cn(sort === option.value && "is-active")}
              onClick={() => {
                onSort(option.value);
                close();
              }}
            >
              {option.label}
            </button>
          ))
        }
      </FilterMenu>
    </div>
  );
}
