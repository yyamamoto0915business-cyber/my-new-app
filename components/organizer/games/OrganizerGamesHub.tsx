"use client";

import "./organizer-games-hub.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  Gamepad2,
  MapPin,
  Plus,
  Sparkles,
  Users,
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

type HubTheme = "stamp" | "quiz" | "mystery" | "mission" | "photo" | "coupon" | "checkin";
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

function TemplateCard({ type }: { type: (typeof HUB_TYPES)[number] }) {
  return (
    <Link href={`/organizer/games/new?type=${type.id}`} className={cn("org-hub__template", `is-${type.theme}`)}>
      <span className="org-hub__template-illust" aria-hidden>
        <Image src={type.icon} alt="" width={128} height={128} unoptimized />
      </span>
      <span className="org-hub__template-copy">
        <span className="org-hub__template-label">{type.label}</span>
        <span className="org-hub__template-blurb">{type.blurb}</span>
      </span>
      <span className="org-hub__template-go" aria-hidden>
        <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.6} />
      </span>
    </Link>
  );
}

function GameCard({ game }: { game: OrganizerGame }) {
  const hubType = HUB_TYPE_BY_ID[game.type] ?? HUB_TYPES[0];
  const cover = COVER_BY_THEME[hubType.theme] ?? hubType.cover;
  const period = formatPeriod(game.startsAt, game.endsAt);

  return (
    <Link href={`/organizer/games/${game.id}`} className={cn("org-hub__game", `is-${hubType.theme}`)}>
      <span className="org-hub__game-cover">
        <Image src={cover} alt="" fill sizes="240px" unoptimized />
        <span className={cn("org-hub__game-status", `is-${game.status}`)}>{STATUS_LABEL[game.status]}</span>
      </span>
      <span className="org-hub__game-body">
        <span className="org-hub__game-name">{game.name}</span>
        {period ? (
          <span className="org-hub__game-period">
            <Calendar className="h-3 w-3" aria-hidden />
            {period}
          </span>
        ) : null}
        <span className="org-hub__game-meta">
          <span className="org-hub__game-type">{hubType.label}</span>
          {game.spotCount > 0 ? (
            <span className="org-hub__game-spots">
              <MapPin className="h-3 w-3" aria-hidden />
              {game.spotCount}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
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
  const [showGameList, setShowGameList] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [games, setGames] = useState<OrganizerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<GameFilter>("draft");
  const [filterReady, setFilterReady] = useState(false);
  const [aboutTemplates, setAboutTemplates] = useState(false);

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

  const benefits: {
    title: string;
    text: string;
    tone: "green" | "amber";
    icon: typeof BookOpen;
    href?: string;
  }[] = [
    { title: "まちの回遊", text: "地域の魅力を再発見", tone: "green", icon: BookOpen },
    { title: "参加者の増加", text: "イベントをもっと楽しく", tone: "amber", icon: Users },
    { title: "効果を見える化", text: "データで振り返り", tone: "green", icon: BarChart3, href: analyticsHref },
  ];

  const mobileTemplates = showAllTemplates ? HUB_TYPES : HUB_TYPES.filter((type) => type.id !== "checkin");

  const openGameList = () => {
    setShowGameList(true);
    window.setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const focusTemplates = () => {
    setPicking(true);
    window.setTimeout(() => {
      templatesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  return (
    <div className="org-hub">
      <div className="org-hub__mobile-home">
        <div className="org-hub__mobile-actions">
          <button
            type="button"
            className={cn("org-hub__mobile-create", picking && "is-picking")}
            aria-expanded={picking}
            aria-controls="mobile-templates"
            onClick={focusTemplates}
          >
            <span className="org-hub__mobile-create-title">ゲームを作る</span>
            <span className="org-hub__mobile-create-plus" aria-hidden>
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="org-hub__mobile-create-label">
              {picking ? "下のカードをタップ" : "種類を選ぶ"}
            </span>
          </button>

          <button type="button" className="org-hub__mobile-library" onClick={openGameList}>
            <span className="org-hub__mobile-library-title">作成したゲーム</span>
            <span className="org-hub__mobile-library-mark" aria-hidden>
              <FileText className="h-5 w-5" strokeWidth={1.8} />
              <span className="org-hub__mobile-count">{loading ? "–" : games.length}</span>
            </span>
            <span className="org-hub__mobile-library-label">一覧を見る</span>
          </button>

          <Link href={analyticsHref} className="org-hub__mobile-library org-hub__mobile-data">
            <span className="org-hub__mobile-library-title">データ</span>
            <span className="org-hub__mobile-library-mark" aria-hidden>
              <BarChart3 className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="org-hub__mobile-library-label">効果を見る</span>
          </Link>
        </div>
        <style>{HUB_DATA_CSS}</style>


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
              {showAllTemplates ? "閉じる" : "すべて見る"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <p className="org-hub__mobile-hint">
            {picking ? "作りたいゲームをタップしてください" : "種類を選ぶと、作成が始まります。"}
          </p>
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
        </section>
      </div>

      <header className="org-hub__hero">
        <Image
          className="org-hub__hero-photo"
          src="/organizer/games/hub-town.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 900px) 1120px, 100vw"
        />
        <div className="org-hub__hero-copy">
          <h1>
            ゲーム機能で
            <span>まちをもっと盛り上げよう！</span>
          </h1>
          <p>スタンプラリーやクイズなど、参加者が楽しめる体験をかんたんに作成できます。</p>
          <DropdownMenu open={pcCreateOpen} onOpenChange={setPcCreateOpen}>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn("org-hub__create", pcCreateOpen && "is-open")}
                  aria-label="新しいゲームを作成する"
                >
                  新しいゲームを作成する
                  <span className="org-hub__create-plus" aria-hidden>
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
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
        <p className="org-hub__bubble">
          まちの魅力を
          <br />
          ゲームでつなごう！
        </p>
        <Image
          className="org-hub__mascot"
          src="/organizer/games/hub-mascot.png"
          alt=""
          width={224}
          height={272}
          priority
        />
      </header>

      <ul className="org-hub__benefits">
        {benefits.map((item) => {
          const Icon = item.icon;
          const inner = (
            <>
              <span className={cn("org-hub__benefit-icon", `is-${item.tone}`)} aria-hidden>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="org-hub__benefit-title">{item.title}</span>
              <span className="org-hub__benefit-text">{item.text}</span>
            </>
          );
          return (
            <li key={item.title}>
              {item.href ? (
                <Link href={item.href} className="org-hub__benefit">
                  {inner}
                </Link>
              ) : (
                <div className="org-hub__benefit">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section
        ref={listRef}
        className={cn("org-hub__section", showGameList && "is-list-open")}
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

      <section className="org-hub__section" id="game-templates" aria-labelledby="game-templates-heading">
        <div className="org-hub__head">
          <h2 id="game-templates-heading">
            <Sparkles className="h-4 w-4" aria-hidden />
            ゲームテンプレート
          </h2>
          <button
            type="button"
            className="org-hub__about"
            aria-expanded={aboutTemplates}
            onClick={() => setAboutTemplates((open) => !open)}
          >
            テンプレートとは
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        {aboutTemplates ? (
          <p className="org-hub__about-copy">種類を選ぶと、その遊びに合った作成画面が開きます。</p>
        ) : null}
        <ul className="org-hub__templates">
          {HUB_TYPES.map((type) => (
            <li key={type.id}>
              <TemplateCard type={type} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
