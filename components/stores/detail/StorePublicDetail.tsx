"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Baby,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  MapPinned,
  Megaphone,
  MessageCircle,
  Phone,
  ShoppingBag,
  Store,
  TreePalm,
  Truck,
  UtensilsCrossed,
  Wifi,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildGoogleMapsUrl } from "@/lib/maps-url";
import {
  featureDefsForKind,
  STORE_NEWS_CATEGORY_LABEL,
  formatStoreDateJa,
  type StoreFeatureKey,
  type StoreNewsRecord,
  type StoreRecord,
  type StoreScheduleRecord,
} from "@/lib/stores/types";
import { buildStoreHeroHighlights } from "@/lib/stores/hero-highlights";
import {
  findTodaySchedule,
  formatScheduleLocationOnly,
  formatScheduleTimeRange,
  resolveKitchenPublicStatus,
  scheduleDateShortLabel,
  scheduleStatusLabel,
  todayIsoDate,
} from "@/lib/stores/schedule-view";
import { StoreHeroHighlightCards } from "@/components/stores/StoreHeroHighlightCards";
import type { StoreMenuItem } from "@/lib/stores/demo-menu";
import type { StoreLinkedEventView } from "@/lib/stores/store-linked-events";

type TabId = "intro" | "news" | "menu" | "access";

const STORE_TABS: {
  id: TabId;
  label: string;
  shortLabel?: string;
  Icon: typeof Store;
}[] = [
  { id: "news", label: "店舗ニュース", Icon: Megaphone },
  { id: "intro", label: "店舗紹介", Icon: Store },
  { id: "menu", label: "メニュー・商品", shortLabel: "メニュー", Icon: UtensilsCrossed },
  { id: "access", label: "アクセス", Icon: MapPin },
];

const KITCHEN_TABS: {
  id: TabId;
  label: string;
  shortLabel?: string;
  Icon: typeof Store;
}[] = [
  {
    id: "news",
    label: "ニュース",
    Icon: Megaphone,
  },
  {
    id: "intro",
    label: "キッチンカー紹介",
    shortLabel: "紹介",
    Icon: Truck,
  },
  {
    id: "menu",
    label: "メニュー・商品",
    shortLabel: "メニュー",
    Icon: UtensilsCrossed,
  },
  { id: "access", label: "出店場所", Icon: MapPin },
];

function FeatureIcon({ icon }: { icon: StoreFeatureKey }) {
  const c = "size-3.5 shrink-0";
  switch (icon) {
    case "wifi":
      return <Wifi className={c} strokeWidth={2} aria-hidden />;
    case "terrace":
    case "outdoor_ok":
      return <TreePalm className={c} strokeWidth={2} aria-hidden />;
    case "child":
      return <Baby className={c} strokeWidth={2} aria-hidden />;
    case "takeout":
      return <ShoppingBag className={c} strokeWidth={2} aria-hidden />;
    case "event_stall":
      return <CalendarDays className={c} strokeWidth={2} aria-hidden />;
    case "cashless":
      return <CreditCard className={c} strokeWidth={2} aria-hidden />;
    case "catering":
      return <UtensilsCrossed className={c} strokeWidth={2} aria-hidden />;
    case "power":
      return <Zap className={c} strokeWidth={2} aria-hidden />;
    default:
      return <Info className={c} strokeWidth={2} aria-hidden />;
  }
}

function newsCategoryClass(category: StoreNewsRecord["category"]): string {
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

function mapsEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=ja&z=15&output=embed`;
}

type Props = {
  store: StoreRecord;
  news: StoreNewsRecord[];
  menu: StoreMenuItem[];
  events?: StoreLinkedEventView[];
  schedules?: StoreScheduleRecord[];
};

export function StorePublicDetail({
  store,
  news,
  menu,
  events = [],
  schedules = [],
}: Props) {
  const [tab, setTab] = useState<TabId>("intro");
  const [fav, setFav] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const isKitchen = store.kind === "kitchen_car";
  const tabs = isKitchen ? KITCHEN_TABS : STORE_TABS;

  const images = useMemo(() => {
    const cover = store.coverImageUrl?.trim() || "";
    const gallery = store.galleryImages.filter(Boolean);
    const list = cover ? [cover, ...gallery.filter((u) => u !== cover)] : gallery;
    return list.length > 0
      ? list
      : ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1400&q=80"];
  }, [store.coverImageUrl, store.galleryImages]);

  const heroSrc = images[Math.min(heroIndex, images.length - 1)]!;
  const todaySchedule = isKitchen ? findTodaySchedule(schedules) : null;
  const nextSchedule = schedules[0] ?? null;
  const featuredSchedule = todaySchedule ?? nextSchedule;
  const mapQuery = isKitchen
    ? featuredSchedule?.location?.trim() || null
    : store.address?.trim() || null;
  const mapsUrl = mapQuery ? buildGoogleMapsUrl(mapQuery) : null;

  const kitchenStatus = isKitchen
    ? resolveKitchenPublicStatus({
        storeStatus: store.status,
        hoursLabel: store.hoursLabel,
        todaySchedule,
        nextSchedule,
      })
    : null;

  const statusOpen = store.status === "public";
  const highlights = useMemo(
    () =>
      buildStoreHeroHighlights({
        features: store.features,
        news,
        kind: store.kind,
      }),
    [store.features, store.kind, news],
  );
  const featureChips = store.features.filter((key) =>
    featureDefsForKind(store.kind).some((d) => d.key === key),
  );
  const placeThumb =
    store.coverImageUrl ||
    store.galleryImages[0] ||
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80";

  const paymentChips = useMemo(
    () => splitPaymentMethods(store.paymentMethods),
    [store.paymentMethods],
  );

  const heroHours = isKitchen
    ? kitchenStatus?.hoursText
    : store.hoursLabel;

  return (
    <div
      className={cn(
        "mg-store-detail",
        isKitchen && "mg-store-detail--kitchen",
      )}
    >
      <section className="sd-hero" aria-label={store.name}>
        <div className="sd-hero__media">
          <div className="sd-hero__img-wrap">
            <Image
              src={heroSrc}
              alt=""
              fill
              priority
              className="sd-hero__img"
              sizes="(max-width: 899px) 100vw, 55vw"
              unoptimized
            />
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  className="sd-hero__nav is-prev"
                  aria-label="前の写真"
                  onClick={() =>
                    setHeroIndex((i) => (i - 1 + images.length) % images.length)
                  }
                >
                  <ChevronLeft className="size-4" strokeWidth={2.4} aria-hidden />
                </button>
                <button
                  type="button"
                  className="sd-hero__nav is-next"
                  aria-label="次の写真"
                  onClick={() => setHeroIndex((i) => (i + 1) % images.length)}
                >
                  <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden />
                </button>
              </>
            ) : null}
            {isKitchen ? (
              <div className="sd-hero__overlay">
                <button
                  type="button"
                  className={cn("sd-hero__fav sd-hero__fav--on-media", fav && "is-on")}
                  aria-label={fav ? "お気に入り解除" : "お気に入りに追加"}
                  aria-pressed={fav}
                  onClick={() => setFav((v) => !v)}
                >
                  <Heart
                    className="size-4"
                    strokeWidth={2}
                    fill={fav ? "currentColor" : "none"}
                    aria-hidden
                  />
                </button>
                <div className="sd-hero__overlay-copy">
                  {kitchenStatus ? (
                    <span
                      className={cn(
                        "sd-badge",
                        kitchenStatus.tone === "open" && "is-open",
                        kitchenStatus.tone === "upcoming" && "is-upcoming",
                        kitchenStatus.tone === "closed" && "is-closed",
                      )}
                    >
                      {kitchenStatus.badge}
                    </span>
                  ) : null}
                  <h1 className="sd-hero__name sd-hero__name--on-media">
                    {store.name}
                  </h1>
                  {featuredSchedule ? (
                    <button
                      type="button"
                      className="sd-hero__place"
                      onClick={() => setTab("access")}
                    >
                      <MapPin className="size-3.5" strokeWidth={2.2} aria-hidden />
                      {formatScheduleLocationOnly(featuredSchedule)}
                    </button>
                  ) : heroHours ? (
                    <p className="sd-hero__overlay-meta">{heroHours}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="sd-hero__gallery">
              {images.slice(0, 4).map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={cn("sd-hero__thumb", heroIndex === i && "is-active")}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`写真${i + 1}`}
                >
                  <Image src={src} alt="" width={72} height={54} unoptimized />
                </button>
              ))}
              {images.length > 4 ? (
                <span className="sd-hero__more">+{images.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="sd-hero__panel">
          <div className="sd-hero__panel-top">
            <div className="sd-hero__meta">
              {isKitchen && kitchenStatus ? (
                <span
                  className={cn(
                    "sd-badge",
                    kitchenStatus.tone === "open" && "is-open",
                    kitchenStatus.tone === "upcoming" && "is-upcoming",
                    kitchenStatus.tone === "closed" && "is-closed",
                  )}
                >
                  {kitchenStatus.badge}
                </span>
              ) : statusOpen ? (
                <span className="sd-badge is-open">営業中</span>
              ) : (
                <span className="sd-badge is-closed">
                  {store.status === "draft" ? "下書き" : "非公開"}
                </span>
              )}
              {heroHours ? (
                <span className="sd-hero__hours">{heroHours}</span>
              ) : null}
            </div>
            <button
              type="button"
              className={cn("sd-hero__fav", fav && "is-on")}
              aria-label={fav ? "お気に入り解除" : "お気に入りに追加"}
              aria-pressed={fav}
              onClick={() => setFav((v) => !v)}
            >
              <Heart
                className="size-4"
                strokeWidth={2}
                fill={fav ? "currentColor" : "none"}
                aria-hidden
              />
              <span className="sd-hero__fav-label">お気に入り</span>
            </button>
          </div>

          <h1 className="sd-hero__name sd-hero__name--panel">{store.name}</h1>
          {store.category ? (
            <p className="sd-hero__category">
              {isKitchen && !store.category.includes("キッチンカー")
                ? `キッチンカー・${store.category}`
                : store.category}
            </p>
          ) : isKitchen ? (
            <p className="sd-hero__category">キッチンカー</p>
          ) : null}
          {store.tagline ? (
            <p className="sd-hero__tagline">{store.tagline}</p>
          ) : store.description ? (
            <p className="sd-hero__tagline">{store.description}</p>
          ) : null}

          {featureChips.length > 0 ? (
            <ul className="sd-hero__features">
              {featureChips.map((key) => (
                <li key={key}>
                  <FeatureIcon icon={key} />
                  {featureDefsForKind(store.kind).find((d) => d.key === key)
                    ?.label ?? key}
                </li>
              ))}
            </ul>
          ) : null}

          <StoreHeroHighlightCards
            items={highlights}
            onSelect={(id) => {
              if (id === "menu") setTab("menu");
              else if (id === "coupon") setTab("news");
              else if (id === "parking") setTab("access");
            }}
          />
        </div>
      </section>

      <div className="sd-shell">
        <nav
          className="sd-tabs"
          aria-label={isKitchen ? "キッチンカー詳細タブ" : "店舗詳細タブ"}
        >
          {tabs.map(({ id, label, shortLabel, Icon }) => (
            <button
              key={id}
              type="button"
              className={cn("sd-tab", tab === id && "is-active")}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon className="size-4" strokeWidth={2.2} aria-hidden />
              <span className="sd-tab__label">
                <span className="sd-tab__label-full">{label}</span>
                {shortLabel ? (
                  <span className="sd-tab__label-short">{shortLabel}</span>
                ) : null}
              </span>
            </button>
          ))}
        </nav>

        <div className="sd-layout" data-tab={tab}>
          <div className="sd-main">
            {tab === "intro" ? <IntroPanel store={store} /> : null}
            {tab === "news" ? <NewsPanel news={news} isKitchen={isKitchen} /> : null}
            {tab === "menu" ? <MenuPanel menu={menu} /> : null}
            {tab === "access" ? (
              <AccessPanel
                store={store}
                mapsUrl={mapsUrl}
                mapQuery={mapQuery}
                schedules={schedules}
                placeThumb={placeThumb}
                todaySchedule={todaySchedule}
                paymentChips={paymentChips}
              />
            ) : null}
          </div>

          {!isKitchen || tab === "access" ? (
            <aside className="sd-aside">
            <div className="sd-actions">
              {isKitchen ? null : mapsUrl && tab !== "access" ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sd-action sd-action--primary"
                >
                  <MapPin className="size-4" strokeWidth={2.2} aria-hidden />
                  ルートマップ
                </a>
              ) : tab !== "access" ? (
                <button
                  type="button"
                  className="sd-action sd-action--primary"
                  onClick={() => setTab("access")}
                >
                  <MapPin className="size-4" strokeWidth={2.2} aria-hidden />
                  アクセスを見る
                </button>
              ) : null}
              {isKitchen ? (
                <button
                  type="button"
                  className="sd-action"
                  onClick={() => setTab("intro")}
                >
                  <Store className="size-4" strokeWidth={2.2} aria-hidden />
                  紹介を見る
                </button>
              ) : null}
              {store.phone ? (
                <a href={`tel:${store.phone.replace(/-/g, "")}`} className="sd-action">
                  <Phone className="size-4" strokeWidth={2.2} aria-hidden />
                  電話する
                </a>
              ) : null}
              {store.websiteUrl ? (
                <a
                  href={store.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sd-action"
                >
                  <ExternalLink className="size-4" strokeWidth={2.2} aria-hidden />
                  公式サイト
                </a>
              ) : null}
              <button
                type="button"
                className="sd-action sd-action--muted"
                disabled
                title="準備中"
              >
                <MessageCircle className="size-4" strokeWidth={2.2} aria-hidden />
                問い合わせ
              </button>
            </div>

            {!isKitchen && (store.seatsInfo || store.paymentMethods) ? (
              <div className="sd-info-card">
                <h2>店舗の基本情報</h2>
                <dl>
                  {store.seatsInfo ? (
                    <div>
                      <dt>席数</dt>
                      <dd>{store.seatsInfo}</dd>
                    </div>
                  ) : null}
                  {store.paymentMethods ? (
                    <div>
                      <dt>支払い</dt>
                      <dd>
                        {paymentChips.length > 0 ? (
                          <ul className="sd-pay-chips">
                            {paymentChips.map((chip) => (
                              <li key={chip}>{chip}</li>
                            ))}
                          </ul>
                        ) : (
                          store.paymentMethods
                        )}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {!isKitchen && events.length > 0 ? (
              <div className="sd-events-card">
                <h2>
                  <CalendarDays className="size-4" strokeWidth={2.2} aria-hidden />
                  開催予定のイベント
                </h2>
                <ul className="sd-events-list">
                  {events.slice(0, 5).map((ev) => (
                    <li key={ev.id}>
                      <Link href={ev.href} className="sd-events-item">
                        <span className="sd-events-date">{ev.dateLabel}</span>
                        <span className="sd-events-title">{ev.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* アクセスタブ中はメインに地図があるのでサイド地図は出さない */}
            {!isKitchen && tab !== "access" && mapQuery ? (
              <div className="sd-map-card">
                <div className="sd-map-embed">
                  <iframe
                    title="地図"
                    src={mapsEmbedUrl(mapQuery)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {store.accessNote ? (
                  <p className="sd-map-note">{store.accessNote}</p>
                ) : null}
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sd-map-link"
                  >
                    地図アプリで開く
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IntroPanel({ store }: { store: StoreRecord }) {
  const isKitchen = store.kind === "kitchen_car";
  const [introOpen, setIntroOpen] = useState(false);
  const sidePhoto =
    store.galleryImages[0] ||
    store.coverImageUrl ||
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80";
  const canExpand = isKitchen && (store.description?.length ?? 0) > 80;

  return (
    <div className="sd-panel-stack">
      <section className="sd-section" aria-labelledby="sd-intro-h">
        <h2 id="sd-intro-h">
          {isKitchen ? "キッチンカー紹介" : "店舗紹介"}
        </h2>
        <div className="sd-intro-grid">
          <div>
            {store.description ? (
              <>
                <p
                  className={cn(
                    "sd-prose sd-prose--intro",
                    isKitchen && "sd-prose--kitchen",
                    introOpen && "is-open",
                  )}
                >
                  {store.description}
                </p>
                {canExpand ? (
                  <button
                    type="button"
                    className="sd-see-all mt-2"
                    onClick={() => setIntroOpen((v) => !v)}
                  >
                    {introOpen ? "閉じる" : "続きを読む"}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="sd-muted">紹介文はまだ登録されていません。</p>
            )}
          </div>
          <div className="sd-intro-photo">
            <Image src={sidePhoto} alt="" fill className="object-cover" unoptimized />
          </div>
        </div>
      </section>
    </div>
  );
}

function SchedulePreviewList({
  schedules,
  placeThumb,
  onSeeAll,
  compact = false,
}: {
  schedules: StoreScheduleRecord[];
  placeThumb: string;
  onSeeAll?: () => void;
  compact?: boolean;
}) {
  const today = todayIsoDate();
  return (
    <ul className={cn("sd-stall-list", compact && "sd-stall-list--compact")}>
      {schedules.map((s) => {
        const time = formatScheduleTimeRange(s.startTime, s.endTime);
        const isToday = s.eventDate === today;
        return (
          <li key={s.id}>
            <button
              type="button"
              className={cn(
                "sd-stall-row",
                compact && "sd-stall-row--compact",
                isToday && "is-today",
              )}
              onClick={onSeeAll}
            >
              <span className="sd-stall-row__date">
                {scheduleDateShortLabel(s.eventDate)}
                {isToday ? (
                  <span className="sd-stall-row__today">本日</span>
                ) : null}
              </span>
              {!compact ? (
                <span className="sd-stall-row__thumb">
                  <Image
                    src={placeThumb}
                    alt=""
                    width={56}
                    height={42}
                    unoptimized
                  />
                </span>
              ) : null}
              <span className="sd-stall-row__body">
                <span className="sd-stall-row__place">
                  {formatScheduleLocationOnly(s)}
                </span>
                <span className="sd-stall-row__sub">
                  {s.eventName}
                  {time ? `・${time}` : ""}
                </span>
              </span>
              <span
                className={cn(
                  "sd-stall-row__badge",
                  isToday && "is-today",
                  s.status === "adjusting" && "is-adjusting",
                )}
              >
                {isToday ? "本日出店" : scheduleStatusLabel(s.status)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NewsPanel({
  news,
  isKitchen,
}: {
  news: StoreNewsRecord[];
  isKitchen: boolean;
}) {
  return (
    <section className="sd-section" aria-labelledby="sd-news-h">
      <h2 id="sd-news-h">
        {isKitchen ? "ニュース" : "店舗ニュース"}
      </h2>
      {news.length === 0 ? (
        <p className="sd-muted">公開中のニュースはありません。</p>
      ) : (
        <div
          className={cn(
            "sd-news-grid",
            isKitchen ? "sd-news-grid--kitchen" : "sd-news-grid--full",
          )}
        >
          {news.map((n) => (
            <NewsCard key={n.id} item={n} compact={isKitchen} />
          ))}
        </div>
      )}
    </section>
  );
}

function MenuPanel({ menu }: { menu: StoreMenuItem[] }) {
  return (
    <section className="sd-section" aria-labelledby="sd-menu-h">
      <h2 id="sd-menu-h">メニュー・商品</h2>
      {menu.length === 0 ? (
        <p className="sd-muted">メニューは準備中です。</p>
      ) : (
        <div className="sd-menu-grid">
          {menu.map((m) => (
            <MenuCard key={m.id} item={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function AccessPanel({
  store,
  mapsUrl,
  mapQuery,
  schedules,
  placeThumb,
  todaySchedule,
  paymentChips = [],
}: {
  store: StoreRecord;
  mapsUrl: string | null;
  mapQuery: string | null;
  schedules: StoreScheduleRecord[];
  placeThumb: string;
  todaySchedule: StoreScheduleRecord | null;
  paymentChips?: string[];
}) {
  const isKitchen = store.kind === "kitchen_car";
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  if (isKitchen) {
    const featured = todaySchedule ?? schedules[0] ?? null;
    const visibleSchedules = showAllSchedules
      ? schedules
      : schedules.slice(0, 3);
    const hiddenCount = schedules.length - visibleSchedules.length;

    return (
      <section className="sd-section sd-section--access" aria-labelledby="sd-access-h">
        <h2 id="sd-access-h" className="sr-only">
          出店場所
        </h2>

        {featured && mapQuery ? (
          <div className="sd-today-banner">
            <div className="sd-today-banner__copy">
              <span
                className={cn(
                  "sd-badge",
                  todaySchedule ? "is-open" : "is-upcoming",
                )}
              >
                {todaySchedule ? "本日出店中" : "次の出店"}
              </span>
              <p className="sd-today-banner__place">
                {formatScheduleLocationOnly(featured)}
              </p>
              <p className="sd-today-banner__meta">
                {scheduleDateShortLabel(featured.eventDate)}
                {formatScheduleTimeRange(featured.startTime, featured.endTime)
                  ? `・${formatScheduleTimeRange(featured.startTime, featured.endTime)}`
                  : ""}
                {featured.eventName ? `・${featured.eventName}` : ""}
              </p>
              {paymentChips.length > 0 ? (
                <ul className="sd-pay-chips sd-pay-chips--banner">
                  {paymentChips.map((chip) => (
                    <li key={chip}>{chip}</li>
                  ))}
                </ul>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sd-see-all mt-2 inline-flex"
                >
                  地図アプリで開く
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : null}
            </div>
            <div className="sd-map-embed sd-map-embed--banner">
              <iframe
                title="出店場所の地図"
                src={mapsEmbedUrl(mapQuery)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {mapsUrl ? (
                <a
                  className="sd-map-tap"
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="地図アプリで開く"
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <p className="sd-muted">
              出店場所は毎回異なります。スケジュールが公開されるとここに表示されます。
            </p>
            {paymentChips.length > 0 ? (
              <ul className="sd-pay-chips sd-pay-chips--banner">
                {paymentChips.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {schedules.length > 0 ? (
          <div className="sd-access-schedules">
            <h3 className="sd-subheading">今後の出店予定</h3>
            <SchedulePreviewList
              schedules={visibleSchedules}
              placeThumb={placeThumb}
              compact
            />
            {hiddenCount > 0 ? (
              <button
                type="button"
                className="sd-see-all mt-2"
                onClick={() => setShowAllSchedules(true)}
              >
                ほか{hiddenCount}件を見る
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="sd-section sd-section--access" aria-labelledby="sd-access-h">
      <div className="sd-section__head">
        <h2 id="sd-access-h">アクセス</h2>
      </div>

      {!store.address && !mapQuery ? (
        <p className="sd-muted">住所はまだ登録されていません。</p>
      ) : (
        <div className="sd-access-card">
          {mapQuery ? (
            <div className="sd-map-embed sd-map-embed--access">
              <iframe
                title={`${store.name}の地図`}
                src={mapsEmbedUrl(mapQuery)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}

          <div className="sd-access-card__body">
            <div className="sd-access-card__place">
              <MapPinned
                className="sd-access-card__icon"
                strokeWidth={2.2}
                aria-hidden
              />
              <div className="sd-access-card__text">
                {store.address ? (
                  <p className="sd-access-card__address">{store.address}</p>
                ) : null}
                {store.accessNote ? (
                  <p className="sd-access-card__note">{store.accessNote}</p>
                ) : null}
                {!store.address && !store.accessNote ? (
                  <p className="sd-muted">住所情報を準備中です。</p>
                ) : null}
              </div>
            </div>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sd-access-card__cta"
              >
                地図アプリで開く
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function NewsCard({
  item,
  compact = false,
}: {
  item: StoreNewsRecord;
  compact?: boolean;
}) {
  const period = [
    item.periodStart ? formatStoreDateJa(item.periodStart) : null,
    item.periodEnd ? formatStoreDateJa(item.periodEnd) : null,
  ]
    .filter(Boolean)
    .join(" ～ ");

  return (
    <article className={cn("sd-news-card", compact && "sd-news-card--compact")}>
      <div className="sd-news-card__media">
        <Image
          src={
            item.thumbnailUrl ||
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80"
          }
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="sd-news-card__body">
        <span className={cn("sd-cat", newsCategoryClass(item.category))}>
          {STORE_NEWS_CATEGORY_LABEL[item.category]}
        </span>
        <h3>{item.title}</h3>
        {!compact && item.excerpt ? <p>{item.excerpt}</p> : null}
        {period ? <time>{period}</time> : null}
      </div>
    </article>
  );
}

function MenuCard({ item }: { item: StoreMenuItem }) {
  return (
    <article className="sd-menu-card">
      <div className="sd-menu-card__media">
        <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
      </div>
      <div className="sd-menu-card__body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>¥{item.priceYen.toLocaleString("ja-JP")}</strong>
      </div>
    </article>
  );
}

function splitPaymentMethods(label: string | null | undefined): string[] {
  if (!label?.trim()) return [];
  return label
    .split(/[・･、,／/]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
