"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  Clock,
  CreditCard,
  ExternalLink,
  EyeOff,
  FileText,
  ImageIcon,
  Loader2,
  Megaphone,
  MapPin,
  Pencil,
  Plus,
  Store,
  Tag,
  Trash2,
  UtensilsCrossed,
  Wifi,
  TreePalm,
  ShoppingBag,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowLeft,
  Truck,
  Zap,
  Eye,
  Check,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreIntroEditForm } from "@/components/organizer/stores/StoreIntroEditForm";
import { StoreAccessEditForm } from "@/components/organizer/stores/StoreAccessEditForm";
import { StoreNewsEditForm } from "@/components/organizer/stores/StoreNewsEditForm";
import { StoreMenuPanel } from "@/components/organizer/stores/StoreMenuPanel";
import { StoreSchedulePanel } from "@/components/organizer/stores/StoreSchedulePanel";
import {
  type OrganizerStore,
  type StoreFeature,
  type StoreNewsItem,
} from "@/lib/organizer/store-management-mock";
import {
  isStoreMostlyEmpty,
  isStoreNameUnset,
  publicPathForKind,
} from "@/lib/stores/draft-shell";
import {
  featureDefsForKind,
  newsCategoryDefsForKind,
  STORE_NEWS_CATEGORY_LABEL,
  type StoreMenuRecord,
  type StoreNewsCategory,
  type StoreNewsRecord,
  type StoreNewsStatus,
  type StoreRecord,
  type StoreScheduleRecord,
} from "@/lib/stores/types";
import type { StoreLinkedEventView } from "@/lib/stores/store-linked-events";
import {
  logStoreUploadError,
  storageErrorMessage,
  uploadStoreImageFile,
} from "@/lib/stores/upload-store-image";
import { buildStoreHeroHighlights } from "@/lib/stores/hero-highlights";
import { StoreHeroHighlightCards } from "@/components/stores/StoreHeroHighlightCards";

type StoreTab = "intro" | "news" | "menu" | "access" | "schedule";

type NewsFilter = "all" | StoreNewsCategory;

function tabsForKind(kind: StoreRecord["kind"]) {
  // short：スマホで1列に並べるための短い名前
  const base: { id: StoreTab; label: string; short: string; Icon: typeof Store }[] = [
    { id: "news", label: kind === "kitchen_car" ? "ニュース" : "店舗ニュース", short: "ニュース", Icon: Megaphone },
    {
      id: "intro",
      label: kind === "kitchen_car" ? "キッチンカー紹介" : "店舗紹介",
      short: "紹介",
      Icon: kind === "kitchen_car" ? Truck : Store,
    },
    { id: "menu", label: "メニュー・商品", short: "メニュー", Icon: UtensilsCrossed },
  ];
  if (kind === "kitchen_car") {
    base.push({ id: "schedule", label: "出店スケジュール", short: "出店予定", Icon: CalendarDays });
  }
  base.push({ id: "access", label: "アクセス", short: "アクセス", Icon: MapPin });
  return base;
}

function newsFiltersForKind(kind: StoreRecord["kind"]): { id: NewsFilter; label: string }[] {
  return [
    { id: "all", label: "すべて" },
    ...newsCategoryDefsForKind(kind).map((d) => ({
      id: d.key as NewsFilter,
      label: d.label,
    })),
  ];
}

function FeatureIcon({ icon }: { icon: StoreFeature["icon"] }) {
  const className = "size-3.5 shrink-0";
  switch (icon) {
    case "wifi":
      return <Wifi className={className} strokeWidth={2} aria-hidden />;
    case "terrace":
    case "outdoor_ok":
      return <TreePalm className={className} strokeWidth={2} aria-hidden />;
    case "child":
      return <Baby className={className} strokeWidth={2} aria-hidden />;
    case "takeout":
      return <ShoppingBag className={className} strokeWidth={2} aria-hidden />;
    case "event_stall":
      return <CalendarDays className={className} strokeWidth={2} aria-hidden />;
    case "cashless":
      return <CreditCard className={className} strokeWidth={2} aria-hidden />;
    case "catering":
      return <UtensilsCrossed className={className} strokeWidth={2} aria-hidden />;
    case "power":
      return <Zap className={className} strokeWidth={2} aria-hidden />;
    default:
      return <Info className={className} strokeWidth={2} aria-hidden />;
  }
}

function newsCategoryClass(category: StoreNewsCategory): string {
  switch (category) {
    case "sale":
      return "bg-[#FFF1E6] text-[#C45C12]";
    case "new_item":
      return "bg-[#E8F5EC] text-[#2D7A4F]";
    case "coupon":
      return "bg-[#E8F0FA] text-[#2B5A8A]";
    case "business":
      return "bg-[#F0EAF8] text-[#6B4A8A]";
    case "stall":
      return "bg-[#FFF8E8] text-[#9A6B12]";
  }
}

function newsStatusLabel(status: StoreNewsStatus): string {
  switch (status) {
    case "public":
      return "公開中";
    case "ended":
      return "終了";
    case "draft":
      return "下書き";
  }
}

function formatNewsPeriod(item: StoreNewsItem): string {
  if (item.periodStart === "—") return "—";
  if (!item.periodEnd) return `${item.periodStart} ～`;
  return `${item.periodStart} ～ ${item.periodEnd}`;
}

type Props = {
  record: StoreRecord;
  view: OrganizerStore;
  newsRecords: StoreNewsRecord[];
  menuRecords: StoreMenuRecord[];
  scheduleRecords?: StoreScheduleRecord[];
  linkedEvents?: StoreLinkedEventView[];
  onRecordChange: (record: StoreRecord) => void;
  onNewsChange: (news: StoreNewsRecord[]) => void;
  onMenuChange: (menu: StoreMenuRecord[]) => void;
  onSchedulesChange?: (schedules: StoreScheduleRecord[]) => void;
};

export function OrganizerStoreManagement({
  record,
  view,
  newsRecords,
  menuRecords,
  scheduleRecords = [],
  linkedEvents = [],
  onRecordChange,
  onNewsChange,
  onMenuChange,
  onSchedulesChange,
}: Props) {
  const isKitchen = record.kind === "kitchen_car";
  const listingLabel = isKitchen ? "キッチンカー" : "店舗";
  const listingsBackHref = "/organizer/listings";
  const tabs = tabsForKind(record.kind);
  const newsFilters = newsFiltersForKind(record.kind);

  const mostlyEmpty = isStoreMostlyEmpty(record);
  const nameUnset = isStoreNameUnset(record);
  // 公開前は「紹介」から、公開後は「ニュース」から開く
  const [activeTab, setActiveTab] = useState<StoreTab>(
    mostlyEmpty || record.status !== "public" ? "intro" : "news",
  );
  const [newsFilter, setNewsFilter] = useState<NewsFilter>("all");
  const [statusBusy, setStatusBusy] = useState(false);
  const [publishHint, setPublishHint] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const store = view;

  const heroImages = useMemo(() => {
    const cover = store.coverImage?.trim() || "";
    const gallery = store.gallery.map((g) => g.src).filter(Boolean);
    if (cover) return [cover, ...gallery.filter((u) => u !== cover)];
    return gallery;
  }, [store.coverImage, store.gallery]);

  useEffect(() => {
    setHeroIndex(0);
  }, [store.id, store.coverImage]);

  async function handleHeroCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    setCoverUploading(true);
    setCoverError(null);
    try {
      const coverImageUrl = await uploadStoreImageFile({
        file,
        kind: "cover",
        storeId: record.id,
      });
      const res = await fetch(`/api/organizer/stores/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "カバー写真の保存に失敗しました");
      }
      onRecordChange(json as StoreRecord);
      setActiveTab("intro");
    } catch (err) {
      logStoreUploadError("hero cover upload", err);
      setCoverError(storageErrorMessage(err));
    } finally {
      setCoverUploading(false);
    }
  }

  const filteredNews = useMemo(() => {
    if (newsFilter === "all") return store.news;
    return store.news.filter((n) => n.category === newsFilter);
  }, [newsFilter, store.news]);

  async function togglePublish() {
    if (record.status !== "public" && nameUnset) {
      setPublishHint(
        `公開するには、${isKitchen ? "キッチンカー名" : "店舗名"}を入力してください。`,
      );
      setActiveTab("intro");
      return;
    }
    setPublishHint(null);
    const nextStatus = record.status === "public" ? "private" : "public";
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/organizer/stores/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok) onRecordChange(json as StoreRecord);
    } finally {
      setStatusBusy(false);
    }
  }

  const hasCover = Boolean(store.coverImage?.trim());
  const heroSrc =
    heroImages[Math.min(heroIndex, Math.max(heroImages.length - 1, 0))] ||
    store.coverImage;
  const heroHighlights = useMemo(
    () =>
      buildStoreHeroHighlights({
        features: record.features,
        news: newsRecords,
        includeDraft: true,
        kind: record.kind,
      }),
    [record.features, record.kind, newsRecords],
  );
  const featureChips = store.features.filter((f) =>
    featureDefsForKind(record.kind).some((d) => d.key === f.id),
  );

  const displayEvents: StoreLinkedEventView[] =
    linkedEvents.length > 0
      ? linkedEvents
      : store.linkedEvents.map((e) => ({
          id: e.id,
          title: e.title,
          dateLabel: e.dateLabel,
          href: "/organizer/events",
        }));

  const viewStoreControl =
    record.status === "public" ? (
      <Link
        href={publicPathForKind(record.kind, store.id)}
        className="org-store-mgmt__view-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {isKitchen ? "公開ページを見る" : "店舗ページを見る"}
        <ExternalLink className="size-3.5" strokeWidth={2.2} aria-hidden />
      </Link>
    ) : null;

  const goIntro = () => setActiveTab("intro");
  const checklistIcons: Record<string, typeof Store> = {
    name: isKitchen ? Truck : Store,
    cover: ImageIcon,
    intro: FileText,
    hours: Clock,
    menu: UtensilsCrossed,
    schedule: CalendarDays,
    access: MapPin,
  };
  const checklist: { key: string; label: string; done: boolean; required?: boolean; onGo: () => void }[] = [
    { key: "name", label: isKitchen ? "キッチンカー名" : "店舗名", done: !nameUnset, required: true, onGo: goIntro },
    { key: "cover", label: "カバー写真", done: Boolean(record.coverImageUrl?.trim()), onGo: () => coverInputRef.current?.click() },
    { key: "intro", label: "紹介文", done: Boolean(record.tagline?.trim() || record.description?.trim()), onGo: goIntro },
    { key: "hours", label: "営業時間", done: Boolean(record.hoursLabel?.trim()), onGo: goIntro },
    { key: "menu", label: "メニュー", done: menuRecords.length > 0, onGo: () => setActiveTab("menu") },
    isKitchen
      ? { key: "schedule", label: "出店の予定", done: scheduleRecords.length > 0, onGo: () => setActiveTab("schedule") }
      : { key: "access", label: "アクセス", done: Boolean(record.address?.trim()), onGo: () => setActiveTab("access") },
  ];

  const tabCount = (id: StoreTab): number =>
    id === "news" ? newsRecords.length : id === "menu" ? menuRecords.length : id === "schedule" ? scheduleRecords.length : 0;

  const publishLabel = statusBusy
    ? "更新中…"
    : record.status === "public"
      ? "非公開にする"
      : "公開する";

  return (
    <div className="org-store-mgmt" data-store-mgmt>
      {/* モバイル: 戻るのみ（タイトルは出さない） */}
      <div className="org-store-mgmt__mobile-nav">
        <Link
          href={listingsBackHref}
          className="org-store-mgmt__mobile-back"
          aria-label="掲載管理に戻る"
        >
          <ArrowLeft className="size-5" strokeWidth={2.2} aria-hidden />
        </Link>
        <h1 className="sr-only">{listingLabel}管理</h1>
      </div>

      {/* PC：ついてくる帯（戻る・店名・状態・プレビュー・公開） */}
      <div className="org-store-mgmt__pc-head">
        <div className="flex items-center gap-3 rounded-[16px] border border-[#e3e8e2] bg-white/95 px-3 py-2 shadow-[0_4px_16px_rgba(22,56,40,0.06)] backdrop-blur-md">
          <Link
            href={listingsBackHref}
            aria-label="掲載管理に戻る"
            title="掲載管理に戻る"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e1e7e2] text-[#173f2c] hover:bg-[#f4f8f5]"
          >
            <ArrowLeft className="size-4" strokeWidth={2.4} aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold text-[#163828]" style={{ fontFamily: "var(--font-serif-display), serif" }}>
              {nameUnset ? `${listingLabel}名未設定` : store.name}
            </h1>
            <p className="flex items-center gap-2 text-[11.5px] font-semibold">
              {record.status === "public" ? (
                <span className="inline-flex items-center gap-1 text-[#1f6a42]">
                  <span className="size-1.5 rounded-full bg-[#2f9a5a]" aria-hidden />
                  公開中
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#8a968c]">
                  <span className="size-1.5 rounded-full bg-[#b9c4bc]" aria-hidden />
                  {record.status === "draft" ? "下書き" : "非公開"}
                </span>
              )}
              {record.status !== "public" ? (
                checklist.every((c) => c.done) ? (
                  <span className="inline-flex items-center gap-0.5 text-[#2f6b47]">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                    公開の準備ができました
                  </span>
                ) : (
                  <span className="text-[#8a6d1f]">公開まで、あと{checklist.filter((c) => !c.done).length}つ</span>
                )
              ) : store.updatedAt ? (
                <span className="text-[#8a968c]">最終更新 {store.updatedAt}</span>
              ) : null}
            </p>
          </div>
          <a
            href={record.status === "public" ? publicPathForKind(record.kind, store.id) : `/stores/${record.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] border border-[#d9bc6e] bg-[#fbf5e3] px-3.5 text-[13px] font-bold text-[#7a5f1c] hover:bg-[#f7edd0]"
          >
            {record.status === "public" ? <ExternalLink className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {record.status === "public" ? "公開ページを見る" : "プレビューを見る"}
          </a>
          <button
            type="button"
            onClick={() => void togglePublish()}
            disabled={statusBusy}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] px-4 text-[13px] font-bold transition disabled:opacity-60",
              record.status === "public"
                ? "border border-[#e1e7e2] bg-white text-[#56645b] hover:bg-[#f4f8f5]"
                : "border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#f6ebc8] shadow-[0_3px_10px_rgba(14,42,29,0.18)]",
            )}
          >
            {statusBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : record.status === "public" ? <EyeOff className="size-4" aria-hidden /> : null}
            {publishLabel}
          </button>
        </div>
      </div>

      {record.status !== "public" && !checklist.every((c) => c.done) ? (
        /* 公開前：公開までにやることを並べる。押すとその入力へ移る（全部できたら上の帯の1行だけ） */
        <section className="rounded-[18px] border border-[#e6dcc0] bg-[#fffbf0] px-4 py-3.5 shadow-[0_1px_4px_rgba(120,90,30,0.05)] max-[899px]:hidden" aria-label="公開までにやること">
          <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[13.5px] font-bold text-[#173f2c]">公開までにやること</p>
            <span className="text-[12px] tabular-nums text-[#8a6d1f]">
              {checklist.filter((c) => c.done).length}/{checklist.length} できました
            </span>
            <span className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-[#f1e6c8]">
              <span
                className="block h-full rounded-full bg-[#2f7d4e] transition-all"
                style={{ width: `${Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)}%` }}
              />
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-1.5 min-[600px]:grid-cols-3 min-[1100px]:grid-cols-6">
            {checklist.filter((c) => !c.done).map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={c.onGo}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-[10px] border px-2.5 py-2 text-left text-[12px] font-semibold transition",
                    c.done
                      ? "border-[#d4e6da] bg-white text-[#2f6b4a]"
                      : "border-[#e6dcc0] bg-white text-[#3f5146] hover:border-[#c9a54e]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                      c.done ? "bg-[#2f7d4e] text-white" : "border border-[#c9a54e] text-transparent",
                    )}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.required && !c.done ? (
                    <span className="shrink-0 rounded-full bg-[#fbf3e1] px-1.5 text-[9.5px] font-bold text-[#a3812f]">必須</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {publishHint ? (
        <p className="rounded-xl border border-[#f0d0c8] bg-[#FFF5F2] px-4 py-2.5 text-[13px] text-[#b42318]">
          {publishHint}
        </p>
      ) : null}

      {/* ヒーロー＋掲載状況 */}
      <div className="org-store-mgmt__top is-wide">
        <section
          className={cn(
            "org-store-mgmt__hero",
            !hasCover && "is-empty",
            hasCover && "is-split",
          )}
          aria-label={isKitchen ? "キッチンカープロフィール" : "店舗プロフィール"}
        >
          {hasCover ? (
            <>
              <div className="org-store-mgmt__hero-media">
                {/* 縦長の写真でも左右が灰色にならないよう、同じ写真をぼかして敷く */}
                <Image
                  src={heroSrc}
                  alt=""
                  fill
                  aria-hidden
                  className="scale-110 object-cover opacity-70 blur-2xl"
                  sizes="40vw"
                  unoptimized
                />
                <Image
                  src={heroSrc}
                  alt=""
                  fill
                  priority
                  className="org-store-mgmt__hero-media-img"
                  sizes="(max-width: 899px) 100vw, 55vw"
                  unoptimized
                />
                {heroImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="org-store-mgmt__hero-nav is-prev"
                      aria-label="前の写真"
                      onClick={() =>
                        setHeroIndex(
                          (i) => (i - 1 + heroImages.length) % heroImages.length,
                        )
                      }
                    >
                      <ChevronLeft className="size-4" strokeWidth={2.4} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="org-store-mgmt__hero-nav is-next"
                      aria-label="次の写真"
                      onClick={() =>
                        setHeroIndex((i) => (i + 1) % heroImages.length)
                      }
                    >
                      <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden />
                    </button>
                    <div className="org-store-mgmt__hero-thumbs">
                      {heroImages.slice(0, 4).map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          className={cn(
                            "org-store-mgmt__hero-thumb",
                            heroIndex === i && "is-active",
                          )}
                          aria-label={`写真${i + 1}`}
                          onClick={() => setHeroIndex(i)}
                        >
                          <Image
                            src={src}
                            alt=""
                            width={72}
                            height={54}
                            unoptimized
                          />
                        </button>
                      ))}
                      {heroImages.length > 4 ? (
                        <span className="org-store-mgmt__hero-more">
                          +{heroImages.length - 4}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="org-store-mgmt__hero-info">
                <div className="org-store-mgmt__hero-info-top">
                  <div className="org-store-mgmt__hero-meta">
                    {store.publishStatus === "public" ? (
                      <span className="org-store-mgmt__badge is-public">公開中</span>
                    ) : store.publishStatus === "draft" ? (
                      <span className="org-store-mgmt__badge is-draft">
                        <FileText className="size-3" strokeWidth={2.2} aria-hidden />
                        下書き
                      </span>
                    ) : (
                      <span className="org-store-mgmt__badge is-private">非公開</span>
                    )}
                    {store.hoursLabel ? (
                      <span className="org-store-mgmt__hours is-chip">
                        <Clock className="size-3" strokeWidth={2.2} aria-hidden />
                        {store.hoursLabel}
                      </span>
                    ) : (
                      <span className="org-store-mgmt__hours is-chip is-muted">
                        <Clock className="size-3" strokeWidth={2.2} aria-hidden />
                        営業時間未設定
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="org-store-mgmt__edit-btn"
                    onClick={() => setActiveTab("intro")}
                  >
                    <Pencil className="size-3.5" strokeWidth={2.2} aria-hidden />
                    編集
                  </button>
                </div>

                <h2
                  className={cn(
                    "org-store-mgmt__name",
                    nameUnset && "is-placeholder",
                  )}
                >
                  {nameUnset
                    ? isKitchen
                      ? "キッチンカー名未設定"
                      : "店舗名未設定"
                    : store.name}
                </h2>
                <p
                  className={cn(
                    "org-store-mgmt__category",
                    !store.category && "is-placeholder",
                  )}
                >
                  <Tag className="size-3" strokeWidth={2.2} aria-hidden />
                  {store.category?.trim() || "カテゴリ未設定"}
                </p>
                <p
                  className={cn(
                    "org-store-mgmt__tagline",
                    !store.tagline && "is-placeholder",
                  )}
                >
                  {store.tagline?.trim() ||
                    "紹介文を入力すると、ここに表示されます"}
                </p>

                {/* ひと目で中身が分かる札：住所・メニュー・写真 */}
                <ul className="mt-2.5 flex flex-wrap gap-1.5 text-[12px] font-semibold text-[#3f5146]">
                  {record.address?.trim() ? (
                    <li className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e3e8e2] bg-[#f7f9f6] px-2.5 py-1">
                      <MapPin className="size-3.5 shrink-0 text-[#b0913f]" aria-hidden />
                      <span className="truncate">{record.address}</span>
                    </li>
                  ) : null}
                  <li>
                    <button type="button" onClick={() => setActiveTab("menu")} className="inline-flex items-center gap-1 rounded-full border border-[#e3e8e2] bg-[#f7f9f6] px-2.5 py-1 hover:border-[#c9a54e]">
                      <UtensilsCrossed className="size-3.5 text-[#b0913f]" aria-hidden />
                      メニュー {menuRecords.length}件
                    </button>
                  </li>
                  <li className="inline-flex items-center gap-1 rounded-full border border-[#e3e8e2] bg-[#f7f9f6] px-2.5 py-1">
                    <Images className="size-3.5 text-[#b0913f]" aria-hidden />
                    写真 {heroImages.length}枚
                  </li>
                  {isKitchen ? (
                    <li>
                      <button type="button" onClick={() => setActiveTab("schedule")} className="inline-flex items-center gap-1 rounded-full border border-[#e3e8e2] bg-[#f7f9f6] px-2.5 py-1 hover:border-[#c9a54e]">
                        <CalendarDays className="size-3.5 text-[#b0913f]" aria-hidden />
                        出店予定 {scheduleRecords.length}件
                      </button>
                    </li>
                  ) : null}
                </ul>

                {featureChips.length > 0 ? (
                  <ul className="org-store-mgmt__features">
                    {featureChips.map((f) => (
                      <li key={f.id} className="org-store-mgmt__feature">
                        <FeatureIcon icon={f.icon} />
                        {f.label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <StoreHeroHighlightCards
                  className="org-store-mgmt__highlights"
                  items={heroHighlights}
                  onSelect={(id) => {
                    if (id === "menu") setActiveTab("menu");
                    else if (id === "coupon") setActiveTab("news");
                    else setActiveTab("access");
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="org-store-mgmt__hero-deco" aria-hidden />
              <div className="org-store-mgmt__hero-empty">
                <div className="org-store-mgmt__hero-main">
                  <div className="org-store-mgmt__hero-meta">
                    {store.publishStatus === "public" ? (
                      <span className="org-store-mgmt__badge is-public">公開中</span>
                    ) : store.publishStatus === "draft" ? (
                      <span className="org-store-mgmt__badge is-draft">
                        <FileText className="size-3" strokeWidth={2.2} aria-hidden />
                        下書き
                      </span>
                    ) : (
                      <span className="org-store-mgmt__badge is-private">非公開</span>
                    )}
                    {store.hoursLabel ? (
                      <span className="org-store-mgmt__hours is-chip">
                        <Clock className="size-3" strokeWidth={2.2} aria-hidden />
                        {store.hoursLabel}
                      </span>
                    ) : (
                      <span className="org-store-mgmt__hours is-chip is-muted">
                        <Clock className="size-3" strokeWidth={2.2} aria-hidden />
                        営業時間未設定
                      </span>
                    )}
                  </div>

                  <h2
                    className={cn(
                      "org-store-mgmt__name",
                      nameUnset && "is-placeholder",
                    )}
                  >
                    {nameUnset
                    ? isKitchen
                      ? "キッチンカー名未設定"
                      : "店舗名未設定"
                    : store.name}
                  </h2>
                  <p
                    className={cn(
                      "org-store-mgmt__category",
                      !store.category && "is-placeholder",
                    )}
                  >
                    <Tag className="size-3" strokeWidth={2.2} aria-hidden />
                    {store.category?.trim() || "カテゴリ未設定"}
                  </p>
                  <p
                    className={cn(
                      "org-store-mgmt__tagline",
                      !store.tagline && "is-placeholder",
                    )}
                  >
                    {store.tagline?.trim() ||
                      "紹介文を入力すると、ここに表示されます"}
                  </p>
                </div>

                <div className="org-store-mgmt__hero-empty-side">
                  <button
                    type="button"
                    className="org-store-mgmt__edit-btn"
                    onClick={() => setActiveTab("intro")}
                  >
                    <Pencil className="size-3.5" strokeWidth={2.2} aria-hidden />
                    編集
                  </button>
                  <button
                    type="button"
                    className="org-store-mgmt__cover-slot"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    aria-label="カバー写真を選択"
                  >
                    <Image
                      src={
                        isKitchen
                          ? "/organizer/listings/illust-kitchen-car.png"
                          : "/organizer/listings/illust-store.png"
                      }
                      alt=""
                      width={220}
                      height={150}
                      className="org-store-mgmt__cover-illust"
                      unoptimized
                    />
                    <span className="org-store-mgmt__cover-unset">
                      {coverUploading ? (
                        <Loader2
                          className="size-3.5 animate-spin"
                          strokeWidth={2.2}
                          aria-hidden
                        />
                      ) : (
                        <ImageIcon className="size-3.5" strokeWidth={2.2} aria-hidden />
                      )}
                      {coverUploading ? "アップロード中…" : "カバー写真を追加"}
                    </span>
                  </button>
                  {coverError ? (
                    <p className="org-store-mgmt__cover-error" role="alert">
                      {coverError}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/jpg,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden"
            onChange={(e) => void handleHeroCoverSelect(e)}
          />
        </section>

        <aside className="org-store-mgmt__aside">
          {/* モバイル: 2ボタン横並び（公開中だけ。公開前は「公開まで」のカードに公開ボタンを置く） */}
          <div className={cn("org-store-mgmt__mobile-actions", record.status !== "public" && "max-[899px]:!hidden")}>
            {viewStoreControl}
            <button
              type="button"
              className={cn(
                "org-store-mgmt__mobile-publish",
                record.status !== "public" && "is-publish",
              )}
              onClick={() => void togglePublish()}
              disabled={statusBusy}
            >
              {record.status === "public" ? (
                <EyeOff className="size-3.5" strokeWidth={2.2} aria-hidden />
              ) : null}
              {publishLabel}
            </button>
          </div>

          {/* PC: 店舗ページ＋掲載状況カード（いまは上の帯にまとめたので出さない） */}
          <div className="org-store-mgmt__pc-aside min-[900px]:!hidden">
            {viewStoreControl}
            <div className="org-store-mgmt__status-card">
              <h3 className="org-store-mgmt__status-title">掲載状況</h3>
              <p
                className={cn(
                  "org-store-mgmt__status-value",
                  store.publishStatus === "public" && "is-public",
                )}
              >
                {store.publishStatus === "public"
                  ? "公開中"
                  : store.publishStatus === "draft"
                    ? "下書き"
                    : "非公開"}
              </p>
              <dl className="org-store-mgmt__status-dl">
                <div>
                  <dt>掲載開始日</dt>
                  <dd>{store.publishedAt}</dd>
                </div>
                <div>
                  <dt>最終更新日</dt>
                  <dd>{store.updatedAt}</dd>
                </div>
              </dl>
              <button
                type="button"
                className={cn(
                  "org-store-mgmt__unpublish-btn",
                  record.status !== "public" && "is-publish",
                )}
                onClick={() => void togglePublish()}
                disabled={statusBusy}
              >
                {publishLabel}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {record.status !== "public" ? (
        /* スマホ：公開までのカード。残りの項目だけを横に並べ、押すとその入力へ。下に公開ボタン */
        <section
          className="relative overflow-hidden rounded-[20px] border border-[#e6dcc0] bg-gradient-to-br from-[#fffdf6] to-[#fbf3df] p-4 shadow-[0_2px_10px_rgba(120,90,30,0.07)] min-[900px]:hidden"
          aria-label="公開までにやること"
        >
          {(() => {
            const doneCount = checklist.filter((c) => c.done).length;
            const left = checklist.length - doneCount;
            const pct = Math.round((doneCount / checklist.length) * 100);
            const todo = checklist.filter((c) => !c.done);
            return (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full"
                    style={{ background: `conic-gradient(#2f7d4e ${pct * 3.6}deg, #efe3c2 0deg)` }}
                    aria-hidden
                  >
                    <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#fffdf6] text-[12px] font-bold tabular-nums text-[#173f2c]">
                      {doneCount}/{checklist.length}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold tracking-[0.14em] text-[#a3812f]">BEFORE PUBLISH</p>
                    <p className="text-[15px] font-bold text-[#173f2c]">
                      {left === 0 ? "公開の準備ができました" : `公開まで、あと${left}つ`}
                    </p>
                  </div>
                </div>
                {todo.length > 0 ? (
                  <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {todo.map((c) => {
                      const Icon = checklistIcons[c.key] ?? Pencil;
                      return (
                        <li key={c.key} className="shrink-0">
                          <button
                            type="button"
                            onClick={c.onGo}
                            className="flex h-10 items-center gap-1.5 rounded-full border border-[#e6d6a8] bg-white pl-2 pr-3 text-[12.5px] font-bold text-[#3f5146] shadow-[0_1px_3px_rgba(120,90,30,0.06)] active:bg-[#fbf5e3]"
                          >
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f6ebc8] text-[#8a6d1f]">
                              <Icon className="size-3.5" strokeWidth={2.3} aria-hidden />
                            </span>
                            {c.label}
                            {c.required ? (
                              <span className="rounded-full bg-[#fbe4e4] px-1.5 text-[9.5px] font-bold text-[#b5483b]">必須</span>
                            ) : (
                              <ChevronRight className="size-3.5 text-[#b9a36a]" strokeWidth={2.4} aria-hidden />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={() => void togglePublish()}
                  disabled={statusBusy}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15px] font-bold text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.22)] disabled:opacity-60"
                >
                  {statusBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {publishLabel}
                </button>
                <a
                  href={`/stores/${record.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] border border-[#e6d6a8] bg-white text-[13px] font-bold text-[#7a5f1c]"
                >
                  <Eye className="size-4" aria-hidden />
                  公開したときの見た目を見る（プレビュー）
                </a>
                {left > 0 ? (
                  <p className="mt-1.5 text-center text-[11px] text-[#8a7a55]">
                    名前があれば公開できます。あとから足しても大丈夫です
                  </p>
                ) : null}
              </>
            );
          })()}
        </section>
      ) : null}

      {/* タブ */}
      <nav
        className="org-store-mgmt__tabs"
        aria-label={`${listingLabel}管理タブ`}
        style={{ ["--store-tab-count" as string]: tabs.length }}
      >
        {tabs.map(({ id, label, short, Icon }) => (
          <button
            key={id}
            type="button"
            className={cn("org-store-mgmt__tab", activeTab === id && "is-active")}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? "page" : undefined}
          >
            <Icon className="size-4" strokeWidth={2.2} aria-hidden />
            <span className="org-store-mgmt__tab-long">{label}</span>
            {tabCount(id) > 0 ? (
              <span className="rounded-full bg-[#eef4ef] px-1.5 text-[10.5px] font-bold tabular-nums text-[#2f6b47] max-[599px]:hidden">{tabCount(id)}</span>
            ) : null}
            <span className="org-store-mgmt__tab-short" aria-hidden>
              {short}
            </span>
          </button>
        ))}
      </nav>

      {/* タブ内容 */}
      {activeTab === "news" ? (
        <NewsPanel
          storeId={record.id}
          kind={record.kind}
          news={filteredNews}
          newsRecords={newsRecords}
          totalCount={store.news.length}
          filter={newsFilter}
          filters={newsFilters}
          onFilterChange={setNewsFilter}
          onNewsChange={onNewsChange}
        />
      ) : null}

      {activeTab === "intro" ? (
        <section className="org-store-mgmt__panel" aria-labelledby="store-intro-heading">
          <h2 id="store-intro-heading" className="sr-only">
            {isKitchen ? "キッチンカー紹介" : "店舗紹介"}
          </h2>
          <StoreIntroEditForm
            key={record.id + record.updatedAt}
            store={record}
            onSaved={onRecordChange}
          />
        </section>
      ) : null}

      {activeTab === "menu" ? (
        <StoreMenuPanel
          storeId={record.id}
          menu={menuRecords}
          onMenuChange={onMenuChange}
        />
      ) : null}

      {activeTab === "schedule" && isKitchen && onSchedulesChange ? (
        <StoreSchedulePanel
          storeId={record.id}
          schedules={scheduleRecords}
          onSchedulesChange={onSchedulesChange}
        />
      ) : null}

      {activeTab === "access" ? (
        <section className="org-store-mgmt__panel" aria-labelledby="store-access-heading">
          <div className="org-store-mgmt__panel-head">
            <h2 id="store-access-heading" className="org-store-mgmt__panel-title">
              {isKitchen ? "アクセス・連絡先" : "アクセス"}
            </h2>
          </div>
          <StoreAccessEditForm
            key={`access-${record.id}-${record.updatedAt}`}
            store={record}
            onSaved={onRecordChange}
            schedules={scheduleRecords}
            onGoToSchedule={
              isKitchen ? () => setActiveTab("schedule") : undefined
            }
          />
        </section>
      ) : null}

      {/* 連携イベント（店舗のみ。キッチンカーは出店スケジュールが主） */}
      {!isKitchen ? (
      <section
        className={cn(
          "org-store-mgmt__events-banner",
          displayEvents.length === 0 && "is-empty",
        )}
        aria-labelledby="store-events-heading"
      >
        <div className="org-store-mgmt__events-copy">
          <div className="org-store-mgmt__events-heading-row">
            <CalendarDays className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
            <h2 id="store-events-heading">この店舗で開催予定のイベント</h2>
          </div>
          <p className="org-store-mgmt__events-desc">
            <span className="org-store-mgmt__events-desc-full">
              イベント作成時に開催店舗を選ぶと、ここに自動で表示されます。
            </span>
            <span className="org-store-mgmt__events-desc-short">
              開催店舗に選ぶとここに表示されます。
            </span>
          </p>
          {displayEvents.length > 0 ? (
            <ul className="org-store-mgmt__events-list">
              {displayEvents.map((ev) => (
                <li key={ev.id}>
                  <Link href={ev.href}>
                    <span className="org-store-mgmt__events-date">{ev.dateLabel}</span>
                    <span className="org-store-mgmt__events-title">{ev.title}</span>
                    {ev.status === "draft" ? (
                      <span className="org-store-mgmt__events-badge">下書き</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="org-store-mgmt__events-empty">まだ連携イベントはありません。</p>
          )}
        </div>
        <div className="org-store-mgmt__events-actions">
          <Link
            href={`/organizer/events/new?storeId=${encodeURIComponent(record.id)}`}
            className="org-store-mgmt__events-link org-store-mgmt__events-link--create"
          >
            この店舗でイベント作成
            <Plus className="size-4" strokeWidth={2.4} aria-hidden />
          </Link>
          <Link
            href="/organizer/events"
            className="org-store-mgmt__events-link org-store-mgmt__events-link--ghost"
          >
            <span className="org-store-mgmt__events-link-full">イベント一覧</span>
            <span className="org-store-mgmt__events-link-short">イベント一覧を見る</span>
            <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </section>
      ) : null}
    </div>
  );
}

function NewsPanel({
  storeId,
  kind,
  news,
  newsRecords,
  totalCount,
  filter,
  filters,
  onFilterChange,
  onNewsChange,
}: {
  storeId: string;
  kind: StoreRecord["kind"];
  news: StoreNewsItem[];
  newsRecords: StoreNewsRecord[];
  totalCount: number;
  filter: NewsFilter;
  filters: { id: NewsFilter; label: string }[];
  onFilterChange: (f: NewsFilter) => void;
  onNewsChange: (news: StoreNewsRecord[]) => void;
}) {
  const isKitchen = kind === "kitchen_car";
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);

  const MOBILE_NEWS_PREVIEW = 4;
  const visibleNews = showAllNews ? news : news.slice(0, MOBILE_NEWS_PREVIEW);
  const hasMoreNews = news.length > MOBILE_NEWS_PREVIEW;
  const mobileShownCount = visibleNews.length;

  useEffect(() => {
    setShowAllNews(false);
  }, [filter]);

  const editingRecord =
    editingId != null
      ? (newsRecords.find((n) => n.id === editingId) ?? null)
      : null;

  async function handleDelete(newsId: string) {
    if (!window.confirm("このニュースを削除しますか？")) return;
    setDeletingId(newsId);
    try {
      const res = await fetch(`/api/organizer/stores/${storeId}/news/${newsId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onNewsChange(newsRecords.filter((n) => n.id !== newsId));
        if (editingId === newsId) {
          setMode("list");
          setEditingId(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (mode === "create" || (mode === "edit" && editingRecord)) {
    return (
      <section className="org-store-mgmt__panel" aria-labelledby="store-news-form-heading">
        <StoreNewsEditForm
          storeId={storeId}
          kind={kind}
          initial={mode === "edit" ? editingRecord : null}
          onCancel={() => {
            setMode("list");
            setEditingId(null);
          }}
          onSaved={(saved) => {
            if (mode === "edit") {
              onNewsChange(
                newsRecords.map((n) => (n.id === saved.id ? saved : n)),
              );
            } else {
              onNewsChange([saved, ...newsRecords.filter((n) => n.id !== saved.id)]);
            }
            setMode("list");
            setEditingId(null);
          }}
        />
      </section>
    );
  }

  return (
    <section className="org-store-mgmt__panel" aria-labelledby="store-news-heading">
      <div className="org-store-mgmt__panel-head">
        <div className="org-store-mgmt__panel-heading">
          <h2 id="store-news-heading" className="org-store-mgmt__panel-title">
            {isKitchen ? "ニュース" : "店舗ニュース"}
          </h2>
          <p className="org-store-mgmt__panel-desc">
            {isKitchen
              ? "セールや出店情報など、最新のお知らせを掲載できます。"
              : "セールや新メニューなど、店舗の最新情報を掲載できます。"}
          </p>
        </div>
        <button
          type="button"
          className="org-store-mgmt__create-btn"
          onClick={() => {
            setMode("create");
            setEditingId(null);
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
          {isKitchen ? "ニュースを作成" : "店舗ニュースを作成"}
        </button>
      </div>

      {totalCount === 0 ? (
        /* まだ1件もないとき：空の表やページ送りは出さず、最初の1件への案内だけ */
        <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-[#d8e2da] bg-[#fbfaf6] px-4 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5f0] text-[#1f6a42]" aria-hidden>
            <Megaphone className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="text-[14px] font-bold text-[#163828]">まだニュースはありません</p>
          <p className="max-w-[26rem] text-[12.5px] leading-relaxed text-[#6b776f]">
            {isKitchen
              ? "出店のお知らせや新メニューを書くと、公開ページに載ります。"
              : "セールや新メニューのお知らせを書くと、店舗ページに載ります。"}
          </p>
          <button
            type="button"
            className="org-store-mgmt__create-btn mt-1"
            onClick={() => {
              setMode("create");
              setEditingId(null);
            }}
          >
            <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
            最初のニュースを書く
          </button>
        </div>
      ) : (
        <>
      <div className="org-store-mgmt__filters" role="tablist" aria-label="ニュース種類">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={cn("org-store-mgmt__filter", filter === f.id && "is-active")}
            onClick={() => onFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* PC テーブル */}
      <div className="org-store-mgmt__table-wrap">
        <table className="org-store-mgmt__table">
          <thead>
            <tr>
              <th scope="col">タイトル</th>
              <th scope="col">種類</th>
              <th scope="col">掲載期間</th>
              <th scope="col">ステータス</th>
              <th scope="col">更新日</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {news.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="org-store-mgmt__news-title-cell">
                    <div className="org-store-mgmt__news-thumb">
                      <Image
                        src={item.thumbnail}
                        alt=""
                        width={56}
                        height={40}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="org-store-mgmt__news-title">{item.title}</p>
                      <p className="org-store-mgmt__news-excerpt">{item.excerpt}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={cn(
                      "org-store-mgmt__cat-badge",
                      newsCategoryClass(item.category),
                    )}
                  >
                    {STORE_NEWS_CATEGORY_LABEL[item.category]}
                  </span>
                </td>
                <td className="org-store-mgmt__muted-cell">{formatNewsPeriod(item)}</td>
                <td>
                  <span
                    className={cn(
                      "org-store-mgmt__news-status",
                      item.status === "public" && "is-public",
                      item.status === "ended" && "is-ended",
                    )}
                  >
                    {newsStatusLabel(item.status)}
                  </span>
                </td>
                <td className="org-store-mgmt__muted-cell">{item.updatedAt}</td>
                <td>
                  <div className="org-store-mgmt__row-actions">
                    <button
                      type="button"
                      className="org-store-mgmt__text-action"
                      onClick={() => {
                        setEditingId(item.id);
                        setMode("edit");
                      }}
                    >
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
                </td>
              </tr>
            ))}
            {news.length === 0 ? (
              <tr>
                <td colSpan={6} className="org-store-mgmt__empty-cell">
                  該当するニュースはありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* モバイル カード（初期は数件のみ） */}
      <ul className="org-store-mgmt__news-cards">
        {visibleNews.map((item) => (
          <li key={item.id} className="org-store-mgmt__news-card">
            <div className="org-store-mgmt__news-thumb">
              <Image
                src={item.thumbnail}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="org-store-mgmt__news-card-body">
              <p className="org-store-mgmt__news-title">{item.title}</p>
              <p className="org-store-mgmt__news-excerpt">{item.excerpt}</p>
              <div className="org-store-mgmt__news-card-meta">
                <span
                  className={cn(
                    "org-store-mgmt__cat-badge",
                    newsCategoryClass(item.category),
                  )}
                >
                  {STORE_NEWS_CATEGORY_LABEL[item.category]}
                </span>
                <span className="org-store-mgmt__news-period">
                  {formatNewsPeriod(item)}
                </span>
              </div>
            </div>
            <div className="org-store-mgmt__news-card-side">
              <span
                className={cn(
                  "org-store-mgmt__news-status",
                  item.status === "public" && "is-public",
                  item.status === "ended" && "is-ended",
                )}
              >
                {newsStatusLabel(item.status)}
              </span>
              <button
                type="button"
                className="org-store-mgmt__news-card-edit"
                aria-label="編集"
                onClick={() => {
                  setEditingId(item.id);
                  setMode("edit");
                }}
              >
                <Pencil className="size-3.5" strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                className="org-store-mgmt__icon-action org-store-mgmt__news-card-delete"
                disabled={deletingId === item.id}
                aria-label="削除"
                onClick={() => void handleDelete(item.id)}
              >
                <Trash2 className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
        {news.length === 0 ? (
          <li className="org-store-mgmt__empty-cell py-6 text-center">
            まだニュースがありません。「{isKitchen ? "ニュースを作成" : "店舗ニュースを作成"}」から登録できます。
          </li>
        ) : null}
      </ul>

      {hasMoreNews ? (
        <button
          type="button"
          className="org-store-mgmt__news-more"
          onClick={() => setShowAllNews((v) => !v)}
        >
          {showAllNews ? "閉じる" : `もっと見る（あと${news.length - MOBILE_NEWS_PREVIEW}件）`}
        </button>
      ) : null}

      <p className="org-store-mgmt__mobile-count">
        {totalCount}件中{" "}
        {mobileShownCount === 0 ? "0" : `1〜${mobileShownCount}`}件を表示
      </p>

      <div className="org-store-mgmt__pagination">
        <p>
          {totalCount}件中 {news.length === 0 ? "0" : `1～${news.length}`}件を表示
        </p>
        <div className="flex items-center gap-1">
          <button type="button" className="org-store-mgmt__page-btn" disabled aria-label="前へ">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className="org-store-mgmt__page-btn is-active" disabled>
            1
          </button>
          <button type="button" className="org-store-mgmt__page-btn" disabled aria-label="次へ">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
        </>
      )}
    </section>
  );
}

