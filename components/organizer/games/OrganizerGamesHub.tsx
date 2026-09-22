"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Sparkles, Stamp } from "lucide-react";
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
  available: boolean;
}[] = [
  {
    id: "stamp",
    theme: "stamp",
    label: "スタンプラリー",
    blurb: "スポットを巡ってスタンプを集めよう",
    icon: "/organizer/games/game-type-stamp.png",
    available: true,
  },
  {
    id: "quiz",
    theme: "quiz",
    label: "クイズラリー",
    blurb: "まちのクイズに挑戦しよう",
    icon: "/organizer/games/game-type-quiz.png",
    available: false,
  },
  {
    id: "mission",
    theme: "mission",
    label: "ミッション",
    blurb: "ミッションに挑戦しよう",
    icon: "/organizer/games/game-type-mission.png",
    available: false,
  },
  {
    id: "photo",
    theme: "photo",
    label: "フォトラリー",
    blurb: "写真を撮って思い出を残そう",
    icon: "/organizer/games/game-type-photo.png",
    available: false,
  },
  {
    id: "coupon",
    theme: "coupon",
    label: "クーポンラリー",
    blurb: "お得なクーポンを集めよう",
    icon: "/organizer/games/game-type-coupon.png",
    available: false,
  },
  {
    id: "checkin",
    theme: "checkin",
    label: "チェックイン",
    blurb: "チェックインしてまちを楽しもう",
    icon: "/organizer/games/game-type-checkin.png",
    available: false,
  },
];

const HUB_TYPE_BY_ID = Object.fromEntries(HUB_TYPES.map((type) => [type.id, type])) as Record<
  string,
  (typeof HUB_TYPES)[number]
>;

const STATUS_LABEL: Record<OrganizerGame["status"], string> = {
  draft: "下書き",
  published: "公開中",
  archived: "アーカイブ",
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatPeriod(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const parts = (value: string, withYear: boolean) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const body = `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
    return withYear ? `${d.getFullYear()}.${body}` : body;
  };
  if (startsAt && endsAt) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${parts(startsAt, true)} 〜 ${parts(endsAt, !sameYear)}`;
  }
  if (startsAt) return `${parts(startsAt, true)} から`;
  return `${parts(endsAt!, true)} まで`;
}

function TypeCard({ type }: { type: (typeof HUB_TYPES)[number] }) {
  const inner = (
    <>
      <span className="org-games__type-illust" aria-hidden>
        <Image src={type.icon} alt="" width={112} height={112} unoptimized />
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

  return (
    <div className="org-games">
      <header className="org-games__hero">
        <div className="org-games__hero-art" aria-hidden>
          <Image
            src="/organizer/games/games-hero.png"
            alt=""
            width={1440}
            height={810}
            priority
            unoptimized
          />
        </div>
        <div className="org-games__hero-copy">
          <p className="org-games__kicker">まちのイベントを、もっと楽しく</p>
          <h1>
            ゲーム機能で
            <br />
            まちをもっと盛り上げよう！
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
            <h2 id="game-types-heading">ゲームタイプ</h2>
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

      <section className="org-games__list" aria-labelledby="game-list-heading">
        <div className="org-games__section-head">
          <div>
            <h2 id="game-list-heading">作成したゲーム</h2>
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
            {games.map((game) => {
              const period = formatPeriod(game.startsAt, game.endsAt);
              const hubType = HUB_TYPE_BY_ID[game.type] ?? HUB_TYPES[0];
              return (
                <li key={game.id}>
                  <Link
                    href={`/organizer/games/${game.id}`}
                    className={cn("org-games__card", `is-${hubType.theme}`)}
                  >
                    <div className="org-games__card-top">
                      <span className="org-games__type-illust" aria-hidden>
                        <Image src={hubType.icon} alt="" width={112} height={112} unoptimized />
                      </span>
                      <span className={cn("org-games__card-status", `is-${game.status}`)}>
                        {STATUS_LABEL[game.status]}
                      </span>
                    </div>
                    <h3>{game.name}</h3>
                    {period ? <p className="org-games__card-period">{period}</p> : null}
                    {game.eventTitle ? (
                      <p className="org-games__card-period">対象：{game.eventTitle}</p>
                    ) : null}
                    <p className="org-games__card-spots">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {game.spotCount > 0 ? `${game.spotCount} スポット` : "スポットを設定"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
