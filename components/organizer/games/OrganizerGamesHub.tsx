"use client";

import "./organizer-games-hub.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  Gamepad2,
  MapPin,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { OrganizerGameTypeId } from "@/lib/organizer/game-types";
import type { OrganizerGame } from "@/lib/organizer/games";
import { GamePurposePicker } from "@/components/organizer/games/GamePurposePicker";
import { OrgEyebrow, ORG_SERIF } from "@/components/organizer/mobile/organizer-theme";

type HubTheme = "stamp" | "quiz" | "mystery" | "mission" | "photo" | "coupon" | "checkin" | "vote" | "lottery" | "survey" | "tournament";
type GameFilter = "draft" | "published" | "archived";

const HUB_TYPES: {
  id: OrganizerGameTypeId;
  theme: HubTheme;
  label: string;
  blurb: string;
  icon: string;
  cover: string;
}[] = [
  {
    id: "stamp",
    theme: "stamp",
    label: "スタンプラリー",
    blurb: "スポットを巡ってスタンプを集めよう",
    icon: "/organizer/games/game-type-stamp.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "quiz",
    theme: "quiz",
    label: "クイズラリー",
    blurb: "クイズに答えてスタンプを集めよう",
    icon: "/organizer/games/game-type-quiz.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "mystery",
    theme: "mystery",
    label: "謎解き街歩き",
    blurb: "まちに隠された謎を解きながら歩こう",
    icon: "/organizer/games/loading-mascot-2.png",
    cover: "/profile/album/spring/sakura.jpg",
  },
  {
    id: "mission",
    theme: "mission",
    label: "ミッション",
    blurb: "スポットでミッションに挑戦しよう",
    icon: "/organizer/games/game-type-mission.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "photo",
    theme: "photo",
    label: "フォトラリー",
    blurb: "写真を撮ってスタンプを集めよう",
    icon: "/organizer/games/game-type-photo.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "coupon",
    theme: "coupon",
    label: "クーポンラリー",
    blurb: "スポットを巡ってクーポンをゲット",
    icon: "/organizer/games/game-type-coupon.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "checkin",
    theme: "checkin",
    label: "チェックイン",
    blurb: "スポットに来てチェックインしよう",
    icon: "/organizer/games/game-type-checkin.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "vote",
    theme: "vote",
    label: "投票",
    blurb: "案を集めて、みんなで1つに決めよう",
    icon: "/organizer/games/loading-mascot-3.png",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "lottery",
    theme: "lottery",
    label: "抽選",
    blurb: "参加した人から当選者を選ぼう",
    icon: "/organizer/games/loading-mascot-3.png",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "survey",
    theme: "survey",
    label: "アンケート",
    blurb: "感想や意見を集めよう",
    icon: "/organizer/games/loading-mascot-3.png",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
  {
    id: "tournament",
    theme: "tournament",
    label: "トーナメント表",
    blurb: "対戦表をみんなのスマホに",
    icon: "/organizer/games/loading-mascot-3.png",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
  },
];

const HUB_TYPE_BY_ID = Object.fromEntries(HUB_TYPES.map((type) => [type.id, type])) as Record<
  string,
  (typeof HUB_TYPES)[number]
>;

const COVER_BY_THEME: Record<HubTheme, string> = {
  stamp: "/organizer/games/game-cover-stamp.png?v=hub2",
  quiz: "/profile/album/spring/flower.jpg",
  mystery: "/profile/album/spring/sakura.jpg",
  mission: "/profile/album/spring/river.jpg",
  photo: "/profile/album/spring/walk.jpg",
  coupon: "/profile/album/spring/town.jpg",
  checkin: "/profile/album/spring/sunset.jpg",
  vote: "/profile/album/spring/town.jpg",
  lottery: "/profile/album/spring/flower.jpg",
  survey: "/profile/album/spring/walk.jpg",
  tournament: "/profile/album/spring/river.jpg",
};

const MOBILE_ART_BY_THEME: Partial<Record<HubTheme, string>> = {
  stamp: "/organizer/games/template-stamp.jpg",
  quiz: "/organizer/games/template-quiz.jpg",
  mystery: "/organizer/games/template-mystery.jpg",
  mission: "/organizer/games/template-mission.jpg",
  photo: "/organizer/games/template-photo.jpg",
  coupon: "/organizer/games/template-coupon.jpg",
};

const FILTERS: { id: GameFilter; label: string }[] = [
  { id: "draft", label: "下書き" },
  { id: "published", label: "公開中" },
  { id: "archived", label: "終了" },
];

const STATUS_LABEL: Record<OrganizerGame["status"], string> = {
  draft: "下書き",
  published: "公開中",
  archived: "終了",
};

function formatPeriod(startsAt: string | null, endsAt: string | null) {
  const fmt = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  };
  const start = startsAt ? fmt(startsAt) : "";
  const end = endsAt ? fmt(endsAt) : "";
  if (start && end) return `${start} 〜 ${end}`;
  return start || end;
}

const STATUS_TAG: Record<OrganizerGame["status"], string> = {
  draft: "bg-[#fdf1d8] text-[#a26a10]",
  published: "bg-[#e3f2e7] text-[#1f7a4a]",
  archived: "bg-[#eef0ec] text-[#6b776f]",
};

/** スマホ・タブレットの1件ぶんの行（掲載管理の行と同じ並び：左に絵・題名・期間・種類） */
function GameCard({ game }: { game: OrganizerGame }) {
  const hubType = HUB_TYPE_BY_ID[game.type] ?? HUB_TYPES[0];
  const cover = COVER_BY_THEME[hubType.theme] ?? hubType.cover;
  const period = formatPeriod(game.startsAt, game.endsAt);

  return (
    <Link
      href={`/organizer/games/${game.id}`}
      className="flex items-center gap-3 rounded-[14px] border border-[#e6e2d6] bg-white p-2.5 no-underline shadow-[0_1px_4px_rgba(23,63,44,0.05)]"
    >
      <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-[#f4f1e8]">
        <Image src={cover} alt="" fill sizes="52px" className="object-cover" unoptimized />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold leading-[16px]", STATUS_TAG[game.status])}>
            {STATUS_LABEL[game.status]}
          </span>
          <span
            className="truncate text-[14px] font-semibold leading-snug text-[#1f2a24]"
            style={{ fontFeatureSettings: '"palt"' }}
          >
            {game.name}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-2 text-[12px] text-[#6b776f]">
          <span className="truncate font-semibold text-[#3f6250]">{hubType.label}</span>
          {period ? (
            <span className="inline-flex shrink-0 items-center gap-0.5">
              <Calendar className="h-3 w-3" aria-hidden />
              {period}
            </span>
          ) : null}
          {game.spotCount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5">
              <MapPin className="h-3 w-3" aria-hidden />
              {game.spotCount}
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#c5c2ba]" aria-hidden />
    </Link>
  );
}

/** PCのテンプレート一覧。写真の上に、種類ごとのキャラクターを丸く重ねる。 */
const PC_TEMPLATES: {
  id: OrganizerGameTypeId;
  label: string;
  mascot: string;
  extra?: boolean;
}[] = [
  { id: "stamp", label: "スタンプラリー", mascot: "/organizer/games/hub-mascot-stamp.png" },
  { id: "quiz", label: "クイズラリー", mascot: "/organizer/games/hub-mascot-quiz.png" },
  { id: "mystery", label: "謎解き街歩き", mascot: "/organizer/games/hub-mascot-mystery.png" },
  { id: "mission", label: "ミッション", mascot: "/organizer/games/hub-mascot-mission.png" },
  { id: "photo", label: "フォトラリー", mascot: "/organizer/games/hub-mascot-photo.png" },
  { id: "vote", label: "投票", mascot: "/organizer/games/hub-mascot.png" },
  { id: "lottery", label: "抽選", mascot: "/organizer/games/loading-mascot-3.png", extra: true },
  { id: "survey", label: "アンケート", mascot: "/organizer/games/loading-mascot-3.png", extra: true },
  { id: "tournament", label: "トーナメント表", mascot: "/organizer/games/loading-mascot-3.png", extra: true },
  { id: "coupon", label: "クーポンラリー", mascot: "/organizer/games/hub-mascot-coupon.png", extra: true },
  {
    id: "checkin",
    label: "チェックイン",
    mascot: "/organizer/games/game-type-checkin.png?v=hub4",
    extra: true,
  },
];

const PC_FILTERS: { id: "all" | GameFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  ...FILTERS,
];

const PC_RECENT_LIMIT = 3;

function PcGameCard({ game }: { game: OrganizerGame }) {
  const router = useRouter();
  const hubType = HUB_TYPE_BY_ID[game.type] ?? HUB_TYPES[0];
  const cover = COVER_BY_THEME[hubType.theme] ?? hubType.cover;
  const period = formatPeriod(game.startsAt, game.endsAt);

  return (
    <div className="org-hub-pc__game">
      <Link href={`/organizer/games/${game.id}`} className="org-hub-pc__game-link">
        <span className="org-hub-pc__game-thumb">
          <Image src={cover} alt="" fill sizes="190px" unoptimized />
        </span>
        <span className="org-hub-pc__game-body">
          <span className="org-hub-pc__game-name">{game.name}</span>
          <span className="org-hub-pc__game-period">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {period || hubType.label}
          </span>
          <span className={cn("org-hub-pc__game-status", `is-${game.status}`)}>
            {STATUS_LABEL[game.status]}
          </span>
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className="org-hub-pc__game-more" aria-label={`${game.name}のメニュー`}>
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </button>
          }
        />
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="z-[70] w-40 rounded-xl border-0 bg-[#faf9f6] p-1 shadow-[0_12px_28px_rgba(26,34,20,0.14)] ring-0"
        >
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-2.5 py-2 text-[0.8rem] font-bold text-[#163524] focus:bg-[#e7f3ea]"
            onClick={() => router.push(`/organizer/games/${game.id}`)}
          >
            開いて編集する
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-2.5 py-2 text-[0.8rem] font-bold text-[#163524] focus:bg-[#e7f3ea]"
            onClick={() => router.push(`/organizer/games/${game.id}/analytics`)}
          >
            データを見る
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** スマホのはじめの画面で、作る・一覧・データの3枚を横に並べる。 */
const HUB_DATA_CSS = `
@media (max-width: 899px) {
  .org-hub .org-hub__mobile-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; }
  .org-hub .org-hub__mobile-create,
  .org-hub .org-hub__mobile-library { min-height: 8.2rem; padding: 0.85rem 0.35rem 0.75rem; text-decoration: none; }
  .org-hub .org-hub__mobile-create-title,
  .org-hub .org-hub__mobile-library-title { font-size: 0.84rem; text-align: center; }
  .org-hub .org-hub__mobile-data .org-hub__mobile-library-mark { background: #fbf1da; color: #a87412; }
}
`;

export function OrganizerGamesHub() {
  const router = useRouter();
  const listRef = useRef<HTMLElement>(null);
  const templatesRef = useRef<HTMLElement>(null);
  const [pcCreateOpen, setPcCreateOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [games, setGames] = useState<OrganizerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<GameFilter>("draft");
  const [filterReady, setFilterReady] = useState(false);
  const pcListRef = useRef<HTMLElement>(null);
  const [pcFilter, setPcFilter] = useState<"all" | GameFilter>("all");
  const [pcShowAllGames, setPcShowAllGames] = useState(false);
  const [pcShowAllTemplates, setPcShowAllTemplates] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/organizer/games", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as { games?: OrganizerGame[] };
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(true);
          setGames([]);
          return;
        }
        setLoadError(false);
        setGames(json.games ?? []);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || filterReady) return;
    const preferred: GameFilter[] = ["draft", "published", "archived"];
    const next = preferred.find((status) => games.some((game) => game.status === status)) ?? "draft";
    setFilter(next);
    setFilterReady(true);
  }, [games, loading, filterReady]);

  const visibleGames = useMemo(
    () => games.filter((game) => game.status === filter),
    [games, filter],
  );

  // 公開中のゲームがあればそれを、なければいちばん新しいゲームのデータを開く。
  const analyticsGame = games.find((game) => game.status === "published") ?? games[0];
  const analyticsHref = analyticsGame
    ? `/organizer/games/${analyticsGame.id}/analytics`
    : "/organizer/games/analytics";

  const pcRecentGames = useMemo(() => {
    const sorted = [...games].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return pcFilter === "all" ? sorted : sorted.filter((game) => game.status === pcFilter);
  }, [games, pcFilter]);
  const pcShownGames = pcShowAllGames ? pcRecentGames : pcRecentGames.slice(0, PC_RECENT_LIMIT);
  const pcTemplates = PC_TEMPLATES;

  const scrollToPcList = () => {
    pcListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mobileTemplates = HUB_TYPES;

  const focusTemplates = () => {
    setPicking(true);
    window.setTimeout(() => {
      templatesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  // 「新しく掲載 → ゲームを作る」から来たとき（?pick=1）は、種類えらびを開いておく
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("pick") === "1") setPicking(true);
  }, []);

  return (
    <div className="org-hub">
      <div className="org-hub__mobile-home">
        {/* 見出し・作るボタン（前は「ゲームを作る」「作成したゲーム」「データ」の大きな箱が3つ並んでいた。一覧はすぐ下にあるので1つにまとめた） */}
        <header className="pt-1">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <OrgEyebrow>GAMES</OrgEyebrow>
              <h1
                className="mt-1 text-[21px] font-bold leading-tight tracking-[0.02em] text-[#173f2c]"
                style={{ fontFamily: ORG_SERIF }}
              >
                ゲーム
              </h1>
            </div>
            <Link
              href={analyticsHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e1d6b4] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#173f2c] no-underline"
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              効果を見る
            </Link>
          </div>
          <button
            type="button"
            className={cn(
              "mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] text-[14px] font-bold shadow-[0_2px_8px_rgba(14,42,29,0.18)] active:scale-[0.98]",
              picking
                ? "border border-[#e1d6b4] bg-white text-[#173f2c] shadow-none"
                : "border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#f6ebc8]"
            )}
            aria-expanded={picking}
            aria-controls="mobile-templates"
            onClick={() => (picking ? setPicking(false) : focusTemplates())}
          >
            {picking ? (
              "種類えらびを閉じる"
            ) : (
              <>
                <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                ゲームを作る
              </>
            )}
          </button>
        </header>
        <style>{HUB_DATA_CSS}</style>


        {/*
          テンプレート（10種類）は、ゲームを作ったことがある人には「ゲームを作る」を押したときだけ出す。
          いつも出していると、作ったゲームの一覧がカード10枚の下になり、毎回スクロールが要った。
        */}
        {picking || (!loading && games.length === 0) ? (
        <section
          id="mobile-templates"
          ref={templatesRef}
          className={cn("org-hub__mobile-templates", picking && "is-picking")}
          aria-labelledby="mobile-templates-heading"
        >
          <div className="org-hub__mobile-templates-head">
            <h2 id="mobile-templates-heading">
              <Sparkles className="h-4 w-4" aria-hidden />
              ゲームテンプレート
            </h2>
            <button
              type="button"
              className="org-hub__mobile-more"
              aria-expanded={showAllTemplates}
              onClick={() => setShowAllTemplates((open) => !open)}
            >
              {showAllTemplates ? "やりたいことから選ぶ" : "すべての種類から選ぶ"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          {/* まず「やりたいこと」から選ぶ（画面案 ①）。全部の種類は「すべての種類から選ぶ」で今までどおり */}
          {!showAllTemplates ? <GamePurposePicker className="pt-1" /> : null}
          {showAllTemplates ? (
          <ul className="org-hub__mobile-grid">
            {mobileTemplates.map((type) => (
              <li key={type.id}>
                <button
                  type="button"
                  className="org-hub__mobile-card"
                  onClick={() => router.push(`/organizer/games/new?type=${type.id}`)}
                >
                  <span className="org-hub__mobile-card-photo">
                    {MOBILE_ART_BY_THEME[type.theme] ? (
                      <Image
                        src={MOBILE_ART_BY_THEME[type.theme]!}
                        alt=""
                        fill
                        sizes="140px"
                        className="org-hub__mobile-card-art"
                        unoptimized
                      />
                    ) : (
                      <>
                        <Image
                          src={COVER_BY_THEME[type.theme]}
                          alt=""
                          fill
                          sizes="140px"
                          unoptimized
                        />
                        <span className="org-hub__mobile-card-mark">
                          <Image src={type.icon} alt="" width={96} height={96} unoptimized />
                        </span>
                      </>
                    )}
                  </span>
                  <span className="org-hub__mobile-card-label">{type.label}</span>
                </button>
              </li>
            ))}
          </ul>
          ) : null}
        </section>
        ) : null}
      </div>

      <div className="org-hub-pc">
        <header className="org-hub-pc__intro">
          <div>
            <p className="org-hub-pc__eyebrow">PLAY YOUR TOWN</p>
            <h1 className="org-hub-pc__title">まちを、遊び場に。</h1>
            <p className="org-hub-pc__lead">ゲームをつくって、地域の魅力を届けよう。</p>
          </div>
          <div className="org-hub-pc__intro-actions">
            <Link href={analyticsHref} className="org-hub-pc__ghost">
              <BarChart3 className="h-4 w-4" aria-hidden />
              データを見る
            </Link>
            <button type="button" className="org-hub-pc__count" onClick={scrollToPcList}>
              作成したゲーム
              <strong>{loading ? "–" : games.length}</strong>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <section className="org-hub-pc__hero" aria-labelledby="org-hub-pc-hero-heading">
          <Image
            className="org-hub-pc__hero-photo"
            src="/organizer/games/hub-pc-street.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 900px) 1200px, 100vw"
          />
          <div className="org-hub-pc__hero-copy">
            <h2 id="org-hub-pc-hero-heading">次の「楽しい」を、つくろう。</h2>
            <p>テンプレートから、かんたんに。</p>
            <DropdownMenu open={pcCreateOpen} onOpenChange={setPcCreateOpen}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn("org-hub-pc__create", pcCreateOpen && "is-open")}
                    aria-label="ゲームを作る"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                    ゲームを作る
                    <ArrowRight className="org-hub-pc__create-arrow h-4 w-4" aria-hidden />
                  </button>
                }
              />
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="org-hub__create-menu z-[70] w-[16.75rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border-0 bg-[#faf9f6] p-1.5 shadow-[0_12px_28px_rgba(26,34,20,0.14)] ring-0"
              >
                {HUB_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    className="org-hub__create-option min-h-11 cursor-pointer flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 focus:bg-[#e7f3ea] focus:text-inherit data-highlighted:bg-[#e7f3ea]"
                    onClick={() => {
                      setPcCreateOpen(false);
                      router.push(`/organizer/games/new?type=${type.id}`);
                    }}
                  >
                    <span className="org-hub__create-option-label">{type.label}</span>
                    <span className="org-hub__create-option-blurb">{type.blurb}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="org-hub-pc__script" aria-hidden>
            Play
            <br />
            Your Town
          </span>
          <p className="org-hub-pc__caption">いつものまちに、新しい発見を。</p>
          <Image
            className="org-hub-pc__hero-mascot"
            src="/organizer/games/hub-mascot-stamp.png"
            alt=""
            width={160}
            height={160}
            priority
          />
        </section>

        <section className="org-hub-pc__section" aria-labelledby="org-hub-pc-templates-heading">
          <div className="org-hub-pc__head">
            <p className="org-hub-pc__kicker">TEMPLATES</p>
            <h2 id="org-hub-pc-templates-heading">ゲームテンプレート</h2>
            <button
              type="button"
              className="org-hub-pc__more"
              aria-expanded={pcShowAllTemplates}
              onClick={() => setPcShowAllTemplates((open) => !open)}
            >
              {pcShowAllTemplates ? "やりたいことから選ぶ" : "すべての種類から選ぶ"}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {!pcShowAllTemplates ? <GamePurposePicker /> : null}
          {pcShowAllTemplates ? (
          <ul className="org-hub-pc__templates">
            {pcTemplates.map((item, index) => (
              <li key={item.id}>
                {/* 写真は使わず、マスコットと名前だけの小さなカードにする */}
                <Link href={`/organizer/games/new?type=${item.id}`} className="org-hub-pc__template">
                  <span className="org-hub-pc__template-mascot" aria-hidden>
                    <Image src={item.mascot} alt="" width={96} height={96} unoptimized />
                  </span>
                  <span className="org-hub-pc__template-text">
                    <span className="org-hub-pc__template-no">{String(index + 1).padStart(2, "0")}</span>
                    <span className="org-hub-pc__template-label">{item.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          ) : null}
        </section>

        <section
          ref={pcListRef}
          className="org-hub-pc__section org-hub-pc__recent"
          aria-labelledby="org-hub-pc-recent-heading"
        >
          <div className="org-hub-pc__head">
            <h2 id="org-hub-pc-recent-heading">最近作成したゲーム</h2>
            <span className="org-hub-pc__rule" aria-hidden />
            <div className="org-hub-pc__filters" role="tablist" aria-label="ゲームの状態">
              {PC_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={pcFilter === item.id}
                  className={cn("org-hub-pc__filter", pcFilter === item.id && "is-on")}
                  onClick={() => {
                    setPcFilter(item.id);
                    setPcShowAllGames(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="org-hub-pc__note" aria-busy>
              読み込み中です…
            </p>
          ) : loadError ? (
            <div className="org-hub-pc__note">
              <p>一覧を取得できませんでした。もう一度試してみてください。</p>
              <button type="button" className="org-hub__retry" onClick={() => window.location.reload()}>
                再読み込み
              </button>
            </div>
          ) : games.length === 0 ? (
            <p className="org-hub-pc__note">まだゲームがありません。上の「ゲームを作る」から始められます。</p>
          ) : pcRecentGames.length === 0 ? (
            <p className="org-hub-pc__note">この状態のゲームはまだありません。</p>
          ) : (
            <>
              <ul className="org-hub-pc__games">
                {pcShownGames.map((game) => (
                  <li key={game.id}>
                    <PcGameCard game={game} />
                  </li>
                ))}
              </ul>
              {pcRecentGames.length > PC_RECENT_LIMIT ? (
                <button
                  type="button"
                  className="org-hub-pc__show-more"
                  onClick={() => setPcShowAllGames((open) => !open)}
                >
                  {pcShowAllGames ? "少なく表示" : `ほかの${pcRecentGames.length - PC_RECENT_LIMIT}件も見る`}
                </button>
              ) : null}
            </>
          )}
        </section>
      </div>
      <section
        ref={listRef}
        className={cn(
          "org-hub__section",
          // スマホでは一覧は is-list-open のときだけ出る。テンプレートを閉じているとき（作ったゲームがあるとき）は最初から出す
          (!picking && !loading && games.length > 0) && "is-list-open"
        )}
        id="created-games"
        aria-labelledby="game-list-heading"
      >
        <div className="org-hub__head">
          <h2 id="game-list-heading">
            <Gamepad2 className="h-4 w-4" aria-hidden />
            作成したゲーム
          </h2>
          <div className="org-hub__filters" role="tablist" aria-label="ゲームの状態">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={cn("org-hub__filter", filter === item.id && "is-on")}
                onClick={() => {
                  setFilterReady(true);
                  setFilter(item.id);
                }}
              >
                {item.label}
                {!loading ? <span className="org-hub__filter-count">{games.filter((g) => g.status === item.id).length}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="org-hub__note" aria-busy>
            読み込み中です…
          </p>
        ) : loadError ? (
          <div className="org-hub__note">
            <p>一覧を取得できませんでした。もう一度試してみてください。</p>
            <button type="button" className="org-hub__retry" onClick={() => window.location.reload()}>
              再読み込み
            </button>
          </div>
        ) : games.length === 0 ? (
          <p className="org-hub__note">まだゲームがありません。上のボタンから作成できます。</p>
        ) : visibleGames.length === 0 ? (
          <p className="org-hub__note">この状態のゲームはまだありません。</p>
        ) : (
          <ul className="org-hub__rail">
            {visibleGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
