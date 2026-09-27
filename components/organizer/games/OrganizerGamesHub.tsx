"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Gamepad2,
  Heart,
  List,
  MapPin,
  Sparkles,
  Stamp,
  Ticket,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizerGameTypeId } from "@/lib/organizer/game-types";
import type { OrganizerGame } from "@/lib/organizer/games";

type HubTheme = "stamp" | "quiz" | "mission" | "photo" | "coupon" | "checkin";

const HUB_TYPES: {
  id: OrganizerGameTypeId;
  theme: HubTheme;
  label: string;
  blurb: string;
  icon: string;
  cover: string;
  available: boolean;
}[] = [
  {
    id: "stamp",
    theme: "stamp",
    label: "スタンプラリー",
    blurb: "スポットを巡って\nスタンプを集めよう",
    icon: "/organizer/games/game-type-stamp.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: true,
  },
  {
    id: "quiz",
    theme: "quiz",
    label: "クイズラリー",
    blurb: "まちのことを知れる\nクイズに挑戦",
    icon: "/organizer/games/game-type-quiz.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: true,
  },
  {
    id: "mission",
    theme: "mission",
    label: "ミッション",
    blurb: "指定された課題に\n挑戦しよう",
    icon: "/organizer/games/game-type-mission.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: false,
  },
  {
    id: "photo",
    theme: "photo",
    label: "フォトラリー",
    blurb: "スポットで写真を撮って\n思い出を残そう",
    icon: "/organizer/games/game-type-photo.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: false,
  },
  {
    id: "coupon",
    theme: "coupon",
    label: "クーポンラリー",
    blurb: "お得なクーポンを\n集めよう",
    icon: "/organizer/games/game-type-coupon.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: false,
  },
  {
    id: "checkin",
    theme: "checkin",
    label: "チェックイン",
    blurb: "スポットに来て\nチェックイン",
    icon: "/organizer/games/game-type-checkin.png?v=hub4",
    cover: "/organizer/games/game-cover-stamp.png?v=hub2",
    available: false,
  },
];

const HUB_TYPE_BY_ID = Object.fromEntries(HUB_TYPES.map((type) => [type.id, type])) as Record<
  string,
  (typeof HUB_TYPES)[number]
>;

const COVER_BY_THEME: Record<HubTheme, string> = {
  stamp: "/organizer/games/game-cover-stamp.png?v=hub2",
  quiz: "/profile/album/spring/flower.jpg",
  mission: "/profile/album/spring/river.jpg",
  photo: "/profile/album/spring/walk.jpg",
  coupon: "/profile/album/spring/town.jpg",
  checkin: "/profile/album/spring/sunset.jpg",
};

const STATUS_LABEL: Record<OrganizerGame["status"], string> = {
  draft: "下書き",
  published: "公開中",
  archived: "アーカイブ",
};

function TypeCard({ type }: { type: (typeof HUB_TYPES)[number] }) {
  const inner = (
    <>
      <span className="org-games__type-illust" aria-hidden>
        <Image src={type.icon} alt="" width={160} height={160} unoptimized />
      </span>
      <span className="org-games__type-label">{type.label}</span>
      <span className="org-games__type-desc">{type.blurb}</span>
      <span className={cn("org-games__type-cta", !type.available && "is-soon")}>
        {type.available ? "作成する" : "準備中"}
        {type.available ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
      </span>
    </>
  );

  if (type.available) {
    return (
      <Link
        href={`/organizer/games/new?type=${type.id}`}
        className={cn("org-games__type-card", `is-${type.theme}`)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn("org-games__type-card", `is-${type.theme}`, "is-soon")} aria-disabled="true">
      {inner}
    </div>
  );
}

function GameCoverCard({ game }: { game: OrganizerGame }) {
  const hubType = HUB_TYPE_BY_ID[game.type] ?? HUB_TYPES[0];
  const cover = COVER_BY_THEME[hubType.theme] ?? hubType.cover;

  return (
    <Link href={`/organizer/games/${game.id}`} className={cn("org-games__card", `is-${hubType.theme}`)}>
      <div className="org-games__card-cover">
        <Image src={cover} alt="" width={640} height={400} unoptimized />
        <span className={cn("org-games__card-status", `is-${game.status}`)}>{STATUS_LABEL[game.status]}</span>
      </div>
      <div className="org-games__card-body">
        <h3>{game.name}</h3>
      </div>
    </Link>
  );
}

export function OrganizerGamesHub() {
  const [games, setGames] = useState<OrganizerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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

  const featured = games[0] ?? null;
  const spotHref = featured ? `/organizer/games/${featured.id}` : "/organizer/games/new";

  return (
    <div className="org-games">
      <header className="org-games__hero">
          <div className="org-games__hero-art" aria-hidden>
            <Image
              src="/organizer/games/games-hero.png?v=hub3"
              alt=""
              width={1440}
              height={810}
              priority
              unoptimized
            />
          </div>
          <ul className="org-games__hero-stickers" aria-hidden>
            <li className="is-stamp">
              <Image src="/organizer/games/game-type-stamp.png?v=hub4" alt="" width={96} height={96} unoptimized />
            </li>
            <li className="is-quiz">
              <Image src="/organizer/games/game-type-quiz.png?v=hub4" alt="" width={96} height={96} unoptimized />
            </li>
            <li className="is-photo">
              <Image src="/organizer/games/game-type-photo.png?v=hub4" alt="" width={96} height={96} unoptimized />
            </li>
          </ul>
          <div className="org-games__hero-copy">
            <p className="org-games__kicker">
              <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
              まち歩きの遊び
            </p>
            <h1>
              ゲーム機能で
              <span>まちをもっと盛り上げよう！</span>
            </h1>
            <p>スタンプラリーやクイズなど、参加者が楽しめる体験をかんたんに作成できます。</p>
            <ul className="org-games__tags">
              <li>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                イベントをもっと楽しく
              </li>
              <li>
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                地域の回遊を促進
              </li>
              <li>
                <Heart className="h-3.5 w-3.5" aria-hidden />
                思い出に残る体験を
              </li>
            </ul>
          </div>
        </header>

        <section className="org-games__types" aria-labelledby="game-types-heading">
          <div className="org-games__section-head">
            <div>
              <h2 id="game-types-heading">
                <Gamepad2 className="h-4 w-4" aria-hidden />
                ゲームタイプ
              </h2>
              <p>イベントに合わせて、いろいろな遊びを選べます。</p>
            </div>
          </div>
          <ul className="org-games__type-grid">
            {HUB_TYPES.map((type) => (
              <li key={type.id}>
                <TypeCard type={type} />
              </li>
            ))}
          </ul>
        </section>

        <div className="org-games__lower">
        <section className="org-games__list" aria-labelledby="game-list-heading">
          <div className="org-games__section-head">
            <div>
              <h2 id="game-list-heading">
                <List className="h-4 w-4" aria-hidden />
                作成したゲーム
              </h2>
              <p>作成したゲームの管理・編集ができます。</p>
            </div>
          </div>

          {loading ? (
            <div className="org-games__empty" aria-busy>
              <p>読み込み中です…</p>
            </div>
          ) : loadError ? (
            <div className="org-games__empty">
              <p className="org-games__empty-title">一覧を取得できませんでした</p>
              <p>通信が遅いときがあります。もう一度試してみてください。</p>
              <button type="button" className="org-games__create" onClick={() => window.location.reload()}>
                再読み込み
              </button>
            </div>
          ) : games.length === 0 ? (
            <div className="org-games__empty">
              <span className="org-games__empty-icon" aria-hidden>
                <Stamp className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <p className="org-games__empty-title">まだゲームがありません</p>
              <p>スタンプラリーを作ると、参加者がQRで巡れる遊びにできます。</p>
              <Link href="/organizer/games/new" className="org-games__create">
                スタンプラリーを作る
              </Link>
            </div>
          ) : (
            <ul className="org-games__cards">
              {games.map((game) => (
                <li key={game.id}>
                  <GameCoverCard game={game} />
                </li>
              ))}
            </ul>
          )}
        </section>

      <aside className="org-games__aside">
        <section className="org-games__quick" aria-labelledby="game-quick-heading">
          <h2 id="game-quick-heading">
            <Zap className="h-4 w-4" aria-hidden />
            クイックアクション
          </h2>
          <ul>
            <li>
              <Link href="/organizer/events/new">
                <Calendar className="h-4 w-4" aria-hidden />
                イベントを作成する
              </Link>
            </li>
            <li>
              <Link href={spotHref}>
                <MapPin className="h-4 w-4" aria-hidden />
                スポットを登録する
              </Link>
            </li>
            <li>
              <Link href="/organizer/stores">
                <Ticket className="h-4 w-4" aria-hidden />
                クーポンを作成する
              </Link>
            </li>
            <li>
              <Link href="/organizer">
                <BarChart3 className="h-4 w-4" aria-hidden />
                データを確認する
              </Link>
            </li>
          </ul>
        </section>
      </aside>
        </div>
    </div>
  );
}
