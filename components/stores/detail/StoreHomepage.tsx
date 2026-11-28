"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Heart,
  Images,
  Info,
  Instagram,
  MapPin,
  Megaphone,
  Navigation,
  Phone,
  Share2,
  ShoppingBag,
  Store,
  TreePalm,
  Truck,
  Armchair,
  UtensilsCrossed,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildGoogleMapsUrl } from "@/lib/maps-url";
import {
  featureDefsForKind,
  formatStoreDateJa,
  STORE_NEWS_CATEGORY_LABEL,
  type StoreFeatureKey,
  type StoreMenuRecord,
  type StoreNewsRecord,
  type StoreRecord,
  type StoreScheduleRecord,
} from "@/lib/stores/types";
import {
  findTodaySchedule,
  formatScheduleLocationOnly,
  formatScheduleTimeRange,
  scheduleDateShortLabel,
  scheduleStatusLabel,
  todayIsoDate,
} from "@/lib/stores/schedule-view";
import type { StoreLinkedEventView } from "@/lib/stores/store-linked-events";

/**
 * お店・キッチンカーの公開ページ（ホームページ型）。
 * ホームページを持たないお店の「公式サイトの代わり」になるよう、タブをやめて1枚のページに並べる。
 * 上から：大きなカバー → すぐ動けるボタン → 見出しの帯（ついてくる）→ 紹介・メニュー・写真・お知らせ・予定・アクセス・運営。
 * PC（900px〜）は右にお店の情報と地図をまとめて置く。
 */

export type StoreHomepageOrganizer = {
  id: string;
  name: string;
  avatarUrl: string | null;
  shortBio: string | null;
  instagramUrl: string | null;
};

type Props = {
  store: StoreRecord;
  news: StoreNewsRecord[];
  menu: StoreMenuRecord[];
  events?: StoreLinkedEventView[];
  schedules?: StoreScheduleRecord[];
  organizer?: StoreHomepageOrganizer | null;
};

type SectionId = "about" | "menu" | "photos" | "news" | "schedule" | "events" | "access" | "owner";

const SERIF = "var(--font-serif-display), 'Shippori Mincho', serif";

function FeatureIcon({ icon }: { icon: StoreFeatureKey }) {
  const c = "size-3.5 shrink-0";
  switch (icon) {
    case "wifi":
      return <Wifi className={c} aria-hidden />;
    case "terrace":
    case "outdoor_ok":
      return <TreePalm className={c} aria-hidden />;
    case "child":
      return <Baby className={c} aria-hidden />;
    case "takeout":
      return <ShoppingBag className={c} aria-hidden />;
    case "event_stall":
      return <CalendarDays className={c} aria-hidden />;
    case "cashless":
      return <CreditCard className={c} aria-hidden />;
    case "catering":
      return <UtensilsCrossed className={c} aria-hidden />;
    case "power":
      return <Zap className={c} aria-hidden />;
    case "parking":
      return <Navigation className={c} aria-hidden />;
    default:
      return <Info className={c} aria-hidden />;
  }
}

function mapsEmbedUrl(q: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=ja&z=16&output=embed`;
}

function splitChips(label: string | null | undefined): string[] {
  if (!label?.trim()) return [];
  return label
    .split(/[・･、,／/]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** 「10:00〜18:00」「6:00〜25:00」などから、いま開いているかを出す（読めない書き方なら null） */
function openNow(hours: string | null | undefined, now: Date): boolean | null {
  if (!hours) return null;
  const m = hours.match(/(\d{1,2})[:：](\d{2})\s*[〜~～\-ー–—]\s*(\d{1,2})[:：](\d{2})/);
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  let end = Number(m[3]) * 60 + Number(m[4]);
  if (end <= start) end += 24 * 60;
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() + 9 * 60) * 60000);
  const cur = jst.getHours() * 60 + jst.getMinutes();
  return (cur >= start && cur < end) || (cur + 24 * 60 >= start && cur + 24 * 60 < end);
}

function newsTone(category: StoreNewsRecord["category"]): string {
  switch (category) {
    case "sale":
      return "bg-[#FFF1E6] text-[#C45C12]";
    case "new_item":
      return "bg-[#E8F5EC] text-[#2D7A4F]";
    case "coupon":
      return "bg-[#E8F0FA] text-[#2B5A8A]";
    case "business":
      return "bg-[#F0EAF8] text-[#6B4A8A]";
    default:
      return "bg-[#FFF8E8] text-[#9A6B12]";
  }
}

function SectionHead({ en, title, id }: { en: string; title: string; id: string }) {
  return (
    <div className="mb-3.5 tablet:mb-4">
      <p className="text-[10.5px] font-bold tracking-[0.22em] text-[#b0913f]">{en}</p>
      <h2 id={id} className="mt-0.5 text-[20px] font-semibold text-[#173f2c] tablet:text-[22px]" style={{ fontFamily: SERIF }}>
        {title}
      </h2>
    </div>
  );
}

export function StoreHomepage({ store, news, menu, events = [], schedules = [], organizer = null }: Props) {
  const isKitchen = store.kind === "kitchen_car";
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [active, setActive] = useState<SectionId>("about");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const photos = useMemo(() => {
    const cover = store.coverImageUrl?.trim() || "";
    const gallery = store.galleryImages.filter(Boolean);
    return cover ? [cover, ...gallery.filter((u) => u !== cover)] : gallery;
  }, [store.coverImageUrl, store.galleryImages]);
  const cover = photos[0] ?? null;

  const todaySchedule = isKitchen ? findTodaySchedule(schedules) : null;
  const featuredSchedule = todaySchedule ?? schedules[0] ?? null;
  const mapQuery = isKitchen ? featuredSchedule?.location?.trim() || null : store.address?.trim() || null;
  const mapsUrl = mapQuery ? buildGoogleMapsUrl(mapQuery) : null;
  const isOpen = isKitchen ? (todaySchedule ? true : null) : now ? openNow(store.hoursLabel, now) : null;

  const featureDefs = featureDefsForKind(store.kind);
  const features = store.features.filter((k) => featureDefs.some((d) => d.key === k));
  const payments = splitChips(store.paymentMethods);
  const instagram = organizer?.instagramUrl?.trim() || null;
  const category = store.category?.trim()
    ? isKitchen && !store.category.includes("キッチンカー")
      ? `キッチンカー・${store.category}`
      : store.category
    : isKitchen
      ? "キッチンカー"
      : null;

  const menuCount = menu.length;
  const photoCount = photos.length;
  const newsCount = news.length;
  const scheduleCount = schedules.length;
  const eventCount = events.length;
  const sections = useMemo(() => {
    const list: { id: SectionId; label: string }[] = [{ id: "about", label: "紹介" }];
    if (menuCount > 0) list.push({ id: "menu", label: isKitchen ? "メニュー" : "メニュー・料金" });
    if (photoCount > 1) list.push({ id: "photos", label: "写真" });
    if (newsCount > 0) list.push({ id: "news", label: "お知らせ" });
    if (isKitchen && scheduleCount > 0) list.push({ id: "schedule", label: "出店予定" });
    if (!isKitchen && eventCount > 0) list.push({ id: "events", label: "イベント" });
    list.push({ id: "access", label: isKitchen ? "出店場所" : "アクセス" });
    return list;
  }, [menuCount, photoCount, newsCount, scheduleCount, eventCount, isKitchen]);

  // 見出しの帯：いま見ている場所を光らせる
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(`sh-${s.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("sh-", "") as SectionId);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // 光っている見出しを帯の中で見える位置へ
  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-sec="${active}"]`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, text: store.tagline ?? undefined, url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  // ひと目で分かる情報：営業時間・場所（市町村まで）・料金の目安・設備
  const area = (() => {
    const src = isKitchen ? (featuredSchedule ? formatScheduleLocationOnly(featuredSchedule) : null) : store.address;
    if (!src) return null;
    const t = src.replace(/〒?\s*\d{3}-?\d{4}\s*/, "").trim();
    const m = t.match(/^(.+?[都道府県])?(.+?[市区町村郡])/);
    return m ? `${m[1] ?? ""}${m[2]}` : t.slice(0, 16);
  })();
  const minPrice = menu.length > 0 ? Math.min(...menu.map((m) => m.priceYen)) : null;
  const facts: { label: string; value: string; icon: React.ReactNode }[] = [];
  if (store.hoursLabel) facts.push({ label: "営業時間", value: store.hoursLabel, icon: <Clock className="size-3.5" aria-hidden /> });
  if (area) facts.push({ label: isKitchen ? "出店場所" : "場所", value: area, icon: <MapPin className="size-3.5" aria-hidden /> });
  if (minPrice != null) facts.push({ label: "料金の目安", value: `¥${minPrice.toLocaleString("ja-JP")}〜`, icon: <CreditCard className="size-3.5" aria-hidden /> });
  if (features.length > 0)
    facts.push({
      label: "設備・特徴",
      value: features.slice(0, 3).map((k) => (featureDefs.find((d) => d.key === k)?.label ?? k).replace(/あり$/, "")).join("・"),
      icon: <Wifi className="size-3.5" aria-hidden />,
    });

  const actionBase =
    "flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] border text-[13px] font-bold transition active:scale-[0.97]";

  const infoRows = (
    <dl className="divide-y divide-[#eef1ec] text-[14px]">
      {store.hoursLabel ? (
        <InfoRow icon={<Clock className="size-4" aria-hidden />} label="営業時間">
          {store.hoursLabel}
        </InfoRow>
      ) : null}
      {!isKitchen && store.address ? (
        <InfoRow icon={<MapPin className="size-4" aria-hidden />} label="住所">
          {store.address}
        </InfoRow>
      ) : null}
      {store.seatsInfo ? (
        <InfoRow icon={<Armchair className="size-4" aria-hidden />} label={isKitchen ? "規模" : "席・設備"}>
          {store.seatsInfo}
        </InfoRow>
      ) : null}
      {payments.length > 0 ? (
        <InfoRow icon={<CreditCard className="size-4" aria-hidden />} label="支払い">
          <span className="flex flex-wrap gap-1.5">
            {payments.map((p) => (
              <span key={p} className="rounded-full border border-[#e3e8e2] bg-[#f7f9f6] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#2f4a3b]">
                {p}
              </span>
            ))}
          </span>
        </InfoRow>
      ) : null}
      {store.phone ? (
        <InfoRow icon={<Phone className="size-4" aria-hidden />} label="電話">
          <a href={`tel:${store.phone.replace(/-/g, "")}`} className="font-semibold text-[#1f5e3a] underline-offset-2 hover:underline">
            {store.phone}
          </a>
        </InfoRow>
      ) : null}
      {store.websiteUrl ? (
        <InfoRow icon={<ExternalLink className="size-4" aria-hidden />} label="サイト">
          <a href={store.websiteUrl} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-[#1f5e3a] underline-offset-2 hover:underline">
            {store.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        </InfoRow>
      ) : null}
    </dl>
  );

  const mapBlock = mapQuery ? (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-[#e3e8e2] bg-[#eef2ec] min-[900px]:aspect-[16/9]">
        <iframe title={`${store.name}の地図`} src={mapsEmbedUrl(mapQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
      </div>
      {store.accessNote ? <p className="mt-2 text-[13px] leading-relaxed text-[#56645b]">{store.accessNote}</p> : null}
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[14px] font-bold text-[#f6ebc8] shadow-[0_3px_10px_rgba(14,42,29,0.18)]"
        >
          <Navigation className="size-4" aria-hidden />
          ここへの行き方（地図アプリ）
        </a>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="pb-12 min-[900px]:pb-16">
      {/* ── 写真（スマホは1枚、タブレット・PC は大1枚＋小4枚） ───────────── */}
      <section aria-label={store.name} className="mx-auto w-full max-w-[1120px] tablet:px-5 tablet:pt-4 min-[900px]:px-8 min-[900px]:pt-6">
        <div className="relative">
          {photos.length >= 5 ? (
            <div className="hidden h-[300px] grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-[22px] tablet:grid min-[900px]:h-[360px]">
              {photos.slice(0, 5).map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={cn("relative overflow-hidden bg-[#dfe8de]", i === 0 && "col-span-2 row-span-2")}
                  aria-label={`写真${i + 1}を大きく見る`}
                >
                  <Image src={src} alt="" fill priority={i === 0} sizes={i === 0 ? "560px" : "280px"} className="object-cover transition duration-500 hover:scale-[1.03]" unoptimized />
                </button>
              ))}
            </div>
          ) : null}
          <div className={cn("relative h-[min(62vw,300px)] overflow-hidden bg-[#dfe8de] tablet:h-[320px] tablet:rounded-[22px] min-[900px]:h-[360px]", photos.length >= 5 && "tablet:hidden")}>
            {cover ? (
              <button type="button" onClick={() => setLightbox(0)} className="absolute inset-0" aria-label="写真を大きく見る">
                <Image src={cover} alt="" fill priority sizes="(max-width: 1120px) 100vw, 1120px" className="object-cover" unoptimized />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#f6ebc8_0,transparent_45%),linear-gradient(135deg,#245a3e,#0e2a1d)]">
                {isKitchen ? <Truck className="size-16 text-[#d9bc6e]/70" aria-hidden /> : <Store className="size-16 text-[#d9bc6e]/70" aria-hidden />}
              </div>
            )}
          </div>
          {photos.length > 1 ? (
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="absolute bottom-10 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-[#173f2c] shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur-sm tablet:bottom-auto tablet:right-4 tablet:top-4"
            >
              <Images className="size-3.5" aria-hidden />
              すべての写真（{photos.length}枚）
            </button>
          ) : null}
        </div>

        {/* ── お店のカード（写真に少し重ねる） ───────────── */}
        <div className="relative z-[1] -mt-7 px-3 tablet:-mt-10 tablet:px-6 min-[900px]:px-10">
          <div className="rounded-[22px] border border-[#e6ebe5] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(22,56,40,0.10)] tablet:px-6 tablet:py-5">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                {category ? <p className="text-[11px] font-bold tracking-[0.18em] text-[#b0913f]">{category}</p> : null}
                <h1
                  className="mt-1 text-[24px] font-semibold leading-snug text-[#163828] [overflow-wrap:anywhere] [text-wrap:balance] [word-break:keep-all] tablet:text-[30px] min-[900px]:text-[34px]"
                  style={{ fontFamily: SERIF }}
                >
                  {store.name}
                </h1>
                {store.tagline ? <p className="mt-1 text-[13.5px] leading-relaxed text-[#56645b] tablet:text-[14.5px]">{store.tagline}</p> : null}
              </div>
              <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {isOpen === true ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[12px] font-bold text-[#1f6a42]">
                      <span className="size-1.5 rounded-full bg-[#2f9a5a]" aria-hidden />
                      {isKitchen ? "本日出店" : "営業中"}
                    </span>
                  ) : isOpen === false ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f1ee] px-2.5 py-1 text-[12px] font-bold text-[#6b776f]">
                      <span className="size-1.5 rounded-full bg-[#a9b3ac]" aria-hidden />
                      営業時間外
                    </span>
                  ) : null}
                  {isKitchen && featuredSchedule ? (
                    <span className="inline-flex min-w-0 items-center gap-1 text-[13px] font-semibold text-[#2f4a3b]">
                      <MapPin className="size-3.5 shrink-0 text-[#b0913f]" aria-hidden />
                      <span className="truncate">
                        {todaySchedule ? "今日：" : `${scheduleDateShortLabel(featuredSchedule.eventDate)}：`}
                        {formatScheduleLocationOnly(featuredSchedule)}
                      </span>
                    </span>
                  ) : null}
                </div>

              <div className="flex shrink-0 gap-2 min-[900px]:w-[440px]">
                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={cn(actionBase, "border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#f6ebc8] shadow-[0_3px_10px_rgba(14,42,29,0.18)]")}>
                    <Navigation className="size-4" aria-hidden />
                    ルート
                  </a>
                ) : null}
                {store.phone ? (
                  <a href={`tel:${store.phone.replace(/-/g, "")}`} className={cn(actionBase, "border-[#dbe5dd] bg-white text-[#173f2c]")}>
                    <Phone className="size-4" aria-hidden />
                    電話
                  </a>
                ) : null}
                {instagram ? (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className={cn(actionBase, "border-[#dbe5dd] bg-white text-[#173f2c]")}>
                    <Instagram className="size-4" aria-hidden />
                    Instagram
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFav((v) => !v)}
                  aria-pressed={fav}
                  aria-label={fav ? "お気に入り解除" : "お気に入りに追加"}
                  className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px] border bg-white transition active:scale-[0.95]", fav ? "border-[#f0c4cf] text-[#d0567a]" : "border-[#dbe5dd] text-[#173f2c]")}
                >
                  <Heart className="size-[18px]" fill={fav ? "currentColor" : "none"} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => void share()}
                  aria-label="このページを共有"
                  className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[#dbe5dd] bg-white text-[#173f2c] transition active:scale-[0.95]"
                >
                  {copied ? <Check className="size-[18px] text-[#2f9a5a]" aria-hidden /> : <Share2 className="size-[18px]" aria-hidden />}
                </button>
              </div>
              </div>
            </div>
            {copied ? <p className="mt-1.5 text-right text-[12px] font-bold text-[#2f9a5a]">ページのURLをコピーしました</p> : null}

            {/* ── ひと目で分かる情報 ───────────── */}
            {facts.length > 0 ? (
              <dl className={cn("mt-4 grid gap-2 border-t border-[#eef1ec] pt-4", facts.length >= 3 ? "grid-cols-2 tablet:grid-cols-4" : "grid-cols-2")}>
                {facts.map((f) => (
                  <div key={f.label} className="min-w-0 rounded-[14px] bg-[#f7f9f6] px-3 py-2.5">
                    <dt className="flex items-center gap-1 text-[11px] font-bold text-[#8a7a55]">
                      <span className="text-[#b0913f]">{f.icon}</span>
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 line-clamp-2 text-[13.5px] font-bold leading-snug text-[#163828]" title={f.value}>
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── 見出しの帯（ついてくる） ───────────────── */}
      <div className="sticky top-[calc(var(--mg-mobile-top-header-h,52px)+env(safe-area-inset-top,0px))] z-30 mt-6 border-y border-[#e7ece5] bg-[#f7f9f6]/95 backdrop-blur-md min-[900px]:top-[var(--mg-pc-top-nav-h)]">
        <div ref={navRef} className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-3 [scrollbar-width:none] tablet:px-5 min-[900px]:px-8 [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <a
              key={s.id}
              data-sec={s.id}
              href={`#sh-${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`sh-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActive(s.id);
              }}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-3 py-3 text-[13px] font-bold transition-colors",
                active === s.id ? "text-[#173f2c]" : "text-[#8a968c]",
              )}
            >
              {s.label}
              <span className={cn("absolute inset-x-3 bottom-0 h-[2.5px] rounded-full transition-opacity", active === s.id ? "bg-[#c9a54e] opacity-100" : "opacity-0")} />
            </a>
          ))}
        </div>
      </div>

      {/* ── 中身 ─────────────────────────────── */}
      <div className="mx-auto mt-6 grid max-w-[1120px] gap-10 px-4 tablet:px-5 min-[900px]:grid-cols-[minmax(0,1fr)_340px] min-[900px]:gap-8 min-[900px]:px-8">
        <div className="min-w-0 space-y-12">
          {/* 紹介 */}
          <section id="sh-about" aria-labelledby="sh-about-h" className="scroll-mt-[120px]">
            <SectionHead en="ABOUT" title={isKitchen ? "このキッチンカーについて" : "このお店について"} id="sh-about-h" />
            {features.length > 0 ? (
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {features.map((key) => (
                  <li key={key} className="inline-flex items-center gap-1 rounded-full border border-[#e3e8e2] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#2f4a3b]">
                    <FeatureIcon icon={key} />
                    {featureDefs.find((d) => d.key === key)?.label ?? key}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className={cn("grid gap-4", photos[1] && "tablet:grid-cols-[minmax(0,1fr)_240px] min-[900px]:grid-cols-[minmax(0,1fr)_260px]")}>
              {store.description ? (
                <ExpandableText text={store.description} />
              ) : (
                <p className="text-[14px] text-[#8a968c]">紹介文はまだありません。</p>
              )}
              {photos[1] ? (
                <button type="button" onClick={() => setLightbox(1)} className="relative hidden aspect-[4/3] self-start overflow-hidden rounded-[18px] tablet:block">
                  <Image src={photos[1]} alt="" fill sizes="260px" className="object-cover" unoptimized />
                </button>
              ) : null}
            </div>
          </section>

          {/* メニュー・料金 */}
          {menu.length > 0 ? (
            <section id="sh-menu" aria-labelledby="sh-menu-h" className="scroll-mt-[120px]">
              <SectionHead en="MENU" title={isKitchen ? "メニュー" : "メニュー・料金"} id="sh-menu-h" />
              <MenuList items={menu} />
            </section>
          ) : null}

          {/* 写真 */}
          {photos.length > 1 ? (
            <section id="sh-photos" aria-labelledby="sh-photos-h" className="scroll-mt-[120px]">
              <SectionHead en="GALLERY" title="写真" id="sh-photos-h" />
              <div className="grid grid-cols-3 gap-1.5 tablet:grid-cols-4 tablet:gap-2">
                {photos.slice(0, 9).map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={cn("relative aspect-square overflow-hidden rounded-[12px] bg-[#eef2ec]", i === 0 && "col-span-2 row-span-2")}
                    aria-label={`写真${i + 1}を大きく見る`}
                  >
                    <Image src={src} alt="" fill sizes="(max-width: 600px) 33vw, 260px" className="object-cover transition duration-300 hover:scale-[1.03]" unoptimized />
                    {i === 8 && photos.length > 9 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[16px] font-bold text-white">+{photos.length - 9}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* お知らせ */}
          {news.length > 0 ? (
            <section id="sh-news" aria-labelledby="sh-news-h" className="scroll-mt-[120px]">
              <SectionHead en="NEWS" title="お知らせ" id="sh-news-h" />
              <NewsList items={news} />
            </section>
          ) : null}

          {/* 出店予定（キッチンカー） */}
          {isKitchen && schedules.length > 0 ? (
            <section id="sh-schedule" aria-labelledby="sh-schedule-h" className="scroll-mt-[120px]">
              <SectionHead en="SCHEDULE" title="出店予定" id="sh-schedule-h" />
              <ScheduleList items={schedules} />
            </section>
          ) : null}

          {/* イベント（お店） */}
          {!isKitchen && events.length > 0 ? (
            <section id="sh-events" aria-labelledby="sh-events-h" className="scroll-mt-[120px]">
              <SectionHead en="EVENTS" title="開催予定のイベント" id="sh-events-h" />
              <ul className="space-y-2">
                {events.slice(0, 6).map((ev) => (
                  <li key={ev.id}>
                    <Link href={ev.href} className="flex items-center gap-3 rounded-[16px] border border-[#e3e8e2] bg-white px-4 py-3 transition hover:border-[#c9a54e]">
                      <span className="shrink-0 rounded-[10px] bg-[#f6ebc8] px-2.5 py-1.5 text-[12px] font-bold text-[#7a5f1c]">{ev.dateLabel}</span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#163828]">{ev.title}</span>
                      <ChevronRight className="size-4 shrink-0 text-[#b9c4bc]" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* アクセス・お店の情報（スマホ・タブレット。PC は右の欄） */}
          <section id="sh-access" aria-labelledby="sh-access-h" className="scroll-mt-[120px]">
            <SectionHead en="ACCESS" title={isKitchen ? "出店場所・情報" : "アクセス・店舗情報"} id="sh-access-h" />
            <div className="grid gap-4 tablet:grid-cols-2 min-[900px]:hidden">
              {mapBlock ?? (
                <p className="rounded-[16px] border border-dashed border-[#d6ded7] bg-white px-4 py-6 text-center text-[13px] text-[#8a968c]">
                  {isKitchen ? "出店場所は、予定が公開されるとここに出ます。" : "住所はまだ登録されていません。"}
                </p>
              )}
              <div className="rounded-[18px] border border-[#e3e8e2] bg-white px-4 py-1">{infoRows}</div>
            </div>
            {/* PC：地図を大きく（お店の情報は右の欄） */}
            <div className="hidden min-[900px]:block">
              {mapBlock ?? (
                <p className="rounded-[16px] border border-dashed border-[#d6ded7] bg-white px-4 py-6 text-center text-[13px] text-[#8a968c]">
                  {isKitchen ? "出店場所は、予定が公開されるとここに出ます。" : "住所はまだ登録されていません。"}
                </p>
              )}
            </div>
          </section>

          {/* 運営 */}
          {organizer ? (
            <section aria-label="運営" className="rounded-[20px] border border-[#ecdcae] bg-gradient-to-br from-[#fffdf6] to-[#fbf3df] p-4 tablet:p-5">
              <p className="text-[10.5px] font-bold tracking-[0.22em] text-[#b0913f]">ORGANIZER</p>
              <Link href={`/organizers/${organizer.id}`} className="mt-2 flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full border border-[#ecdcae] bg-white">
                  {organizer.avatarUrl ? (
                    <Image src={organizer.avatarUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[18px] font-bold text-[#b0913f]">{organizer.name.slice(0, 1)}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-[#163828]">{organizer.name}</span>
                  {organizer.shortBio ? <span className="mt-0.5 block truncate text-[12.5px] text-[#6b776f]">{organizer.shortBio}</span> : null}
                </span>
                <span className="shrink-0 text-[12.5px] font-bold text-[#1f5e3a]">ページを見る ›</span>
              </Link>
            </section>
          ) : null}
        </div>

        {/* PC：右の欄（ついてくる） */}
        <aside className="hidden min-[900px]:block">
          <div className="sticky top-[calc(var(--mg-pc-top-nav-h)+64px)] space-y-4">
            <div className="rounded-[20px] border border-[#e3e8e2] bg-white px-5 py-2 shadow-[0_4px_18px_rgba(22,56,40,0.05)]">
              <p className="pt-3 text-[10.5px] font-bold tracking-[0.22em] text-[#b0913f]">INFORMATION</p>
              {infoRows}
            </div>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[14px] font-bold text-[#f6ebc8] shadow-[0_3px_10px_rgba(14,42,29,0.18)]"
              >
                <Navigation className="size-4" aria-hidden />
                ここへの行き方
              </a>
            ) : null}
          </div>
        </aside>
      </div>

      {lightbox !== null && photos.length > 0 ? (
        <Lightbox photos={photos} index={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <dt className="flex w-[84px] shrink-0 items-start gap-1.5 pt-0.5 text-[12.5px] font-bold text-[#8a7a55]">
        <span className="text-[#b0913f]">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 leading-relaxed text-[#1f2f26]">{children}</dd>
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const long = text.length > 160;
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className={cn("whitespace-pre-line text-[15px] leading-[1.95] text-[#2b3a31]", long && !open && "line-clamp-5 tablet:line-clamp-none")}>{text}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1.5 text-[13px] font-bold text-[#1f5e3a] tablet:hidden">
          {open ? "閉じる" : "続きを読む"}
        </button>
      ) : null}
    </div>
  );
}

function MenuList({ items }: { items: StoreMenuRecord[] }) {
  const [all, setAll] = useState(false);
  const LIMIT = 8;
  const shown = all ? items : items.slice(0, LIMIT);
  const withPhotos = items.filter((m) => m.imageUrl).length >= Math.ceil(items.length / 2);
  return (
    <div>
      {withPhotos ? (
        <div className="grid grid-cols-2 gap-2.5 tablet:grid-cols-3 tablet:gap-3">
          {shown.map((m) => (
            <article key={m.id} className="overflow-hidden rounded-[18px] border border-[#e3e8e2] bg-white">
              <div className="relative aspect-[4/3] bg-[#eef2ec]">
                {m.imageUrl ? <Image src={m.imageUrl} alt="" fill sizes="(max-width: 600px) 50vw, 240px" className="object-cover" unoptimized /> : null}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#163828]">{m.name}</h3>
                {m.description ? <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6b776f]">{m.description}</p> : null}
                <p className="mt-1.5 text-[15px] font-bold tabular-nums text-[#7a5f1c]">¥{m.priceYen.toLocaleString("ja-JP")}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-[#eef1ec] rounded-[20px] border border-[#e3e8e2] bg-white px-4 tablet:px-6">
          {shown.map((m) => (
            <li key={m.id} className="flex gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="min-w-0 text-[14.5px] font-bold leading-snug text-[#163828]">{m.name}</h3>
                  <span className="min-w-[16px] flex-1 translate-y-[-3px] border-b border-dotted border-[#d6ccb0]" aria-hidden />
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-[#7a5f1c]">¥{m.priceYen.toLocaleString("ja-JP")}</span>
                </div>
                {m.description ? <p className="mt-1 text-[12.5px] leading-relaxed text-[#6b776f]">{m.description}</p> : null}
              </div>
              {m.imageUrl ? (
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-[#eef2ec]">
                  <Image src={m.imageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {items.length > LIMIT ? (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-[#dbe5dd] bg-white text-[13.5px] font-bold text-[#173f2c]">
          {all ? "閉じる" : `すべて見る（${items.length}件）`}
        </button>
      ) : null}
    </div>
  );
}

function NewsList({ items }: { items: StoreNewsRecord[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 3);
  return (
    <div>
      <ul className="space-y-2.5">
        {shown.map((n) => {
          const period = [n.periodStart ? formatStoreDateJa(n.periodStart) : null, n.periodEnd ? formatStoreDateJa(n.periodEnd) : null].filter(Boolean).join(" ～ ");
          return (
            <li key={n.id} className="flex gap-3 rounded-[18px] border border-[#e3e8e2] bg-white p-3">
              {n.thumbnailUrl ? (
                <span className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-[#eef2ec] tablet:size-24">
                  <Image src={n.thumbnailUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex size-20 shrink-0 items-center justify-center rounded-[12px] bg-[#f6ebc8] text-[#b0913f] tablet:size-24">
                  <Megaphone className="size-6" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", newsTone(n.category))}>{STORE_NEWS_CATEGORY_LABEL[n.category]}</span>
                <h3 className="mt-1 line-clamp-2 text-[14.5px] font-bold leading-snug text-[#163828]">{n.title}</h3>
                {n.excerpt ? <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6b776f]">{n.excerpt}</p> : null}
                {period ? <time className="mt-1 block text-[11.5px] text-[#8a968c]">{period}</time> : null}
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > 3 ? (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-[#dbe5dd] bg-white text-[13.5px] font-bold text-[#173f2c]">
          {all ? "閉じる" : `すべて見る（${items.length}件）`}
        </button>
      ) : null}
    </div>
  );
}

function ScheduleList({ items }: { items: StoreScheduleRecord[] }) {
  const [all, setAll] = useState(false);
  const today = todayIsoDate();
  const shown = all ? items : items.slice(0, 4);
  return (
    <div>
      <ul className="space-y-2">
        {shown.map((s) => {
          const isToday = s.eventDate === today;
          const time = formatScheduleTimeRange(s.startTime, s.endTime);
          return (
            <li key={s.id} className={cn("flex items-center gap-3 rounded-[16px] border bg-white px-4 py-3", isToday ? "border-[#9fd0b0]" : "border-[#e3e8e2]")}>
              <span className={cn("shrink-0 rounded-[10px] px-2.5 py-1.5 text-center text-[12px] font-bold", isToday ? "bg-[#e6f4ea] text-[#1f6a42]" : "bg-[#f6ebc8] text-[#7a5f1c]")}>
                {isToday ? "本日" : scheduleDateShortLabel(s.eventDate)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-[#163828]">{formatScheduleLocationOnly(s)}</span>
                <span className="block truncate text-[12px] text-[#6b776f]">
                  {s.eventName}
                  {time ? `・${time}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-[11.5px] font-bold text-[#8a968c]">{isToday ? "出店中" : scheduleStatusLabel(s.status)}</span>
            </li>
          );
        })}
      </ul>
      {items.length > 4 ? (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-[#dbe5dd] bg-white text-[13.5px] font-bold text-[#173f2c]">
          {all ? "閉じる" : `すべて見る（${items.length}件）`}
        </button>
      ) : null}
    </div>
  );
}

function Lightbox({ photos, index, onChange, onClose }: { photos: string[]; index: number; onChange: (i: number) => void; onClose: () => void }) {
  const startX = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, photos.length, onChange, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="写真"
      className="fixed inset-0 z-[200] flex flex-col bg-black/92"
      onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        if (Math.abs(dx) > 50) onChange(dx < 0 ? (index + 1) % photos.length : (index - 1 + photos.length) % photos.length);
        startX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[calc(12px+env(safe-area-inset-top,0px))] text-white">
        <span className="text-[13px] font-bold tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button type="button" onClick={onClose} aria-label="閉じる" className="flex size-10 items-center justify-center rounded-full bg-white/10">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Image src={photos[index]!} alt="" fill sizes="100vw" className="object-contain" unoptimized />
        {photos.length > 1 ? (
          <>
            <button type="button" onClick={() => onChange((index - 1 + photos.length) % photos.length)} aria-label="前の写真" className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white tablet:flex">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => onChange((index + 1) % photos.length)} aria-label="次の写真" className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white tablet:flex">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
      <div className="flex justify-center gap-1.5 overflow-x-auto px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-3">
        {photos.map((src, i) => (
          <button key={src + i} type="button" onClick={() => onChange(i)} aria-label={`写真${i + 1}`} className={cn("relative size-12 shrink-0 overflow-hidden rounded-[8px] border-2", i === index ? "border-[#d9bc6e]" : "border-transparent opacity-60")}>
            <Image src={src} alt="" fill sizes="48px" className="object-cover" unoptimized />
          </button>
        ))}
      </div>
    </div>
  );
}
