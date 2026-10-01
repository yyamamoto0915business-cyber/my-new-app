"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  Flag,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  MessageCircle,
  Pencil,
  Play,
  Repeat2,
  Sparkles,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./OrganizerGameAnalytics.module.css";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { GameAnalytics } from "@/lib/organizer/game-analytics";
import type { OrganizerGame } from "@/lib/organizer/games";

type TabId = "overview" | "people" | "spots" | "questions" | "hours" | "rewards" | "survey";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "概要", icon: LayoutDashboard },
  { id: "people", label: "参加者", icon: Users },
  { id: "spots", label: "スポット", icon: MapPin },
  { id: "questions", label: "問題", icon: HelpCircle },
  { id: "hours", label: "時間帯", icon: Clock },
  { id: "rewards", label: "特典・クーポン", icon: Ticket },
  { id: "survey", label: "アンケート", icon: MessageCircle },
];

const STATUS_LABEL: Record<GameAnalytics["game"]["status"], string> = {
  draft: "下書き",
  published: "公開中",
  archived: "アーカイブ",
};

const TYPE_MARK: Partial<Record<OrganizerGame["type"], string>> = {
  stamp: "/organizer/games/game-type-stamp.png",
  quiz: "/organizer/games/game-type-quiz.png",
  mission: "/organizer/games/game-type-mission.png",
  photo: "/organizer/games/game-type-photo.png",
  coupon: "/organizer/games/game-type-coupon.png",
  checkin: "/organizer/games/game-type-checkin.png",
};

function gameTypeMark(type: OrganizerGame["type"]) {
  return TYPE_MARK[type] ?? "/organizer/games/game-type-stamp.png";
}

const SPOT_KIND_LABEL: Record<string, string> = {
  stamp: "スタンプ",
  goal: "ゴール",
};

function maxCount(values: { count: number }[]): number {
  return Math.max(1, ...values.map((row) => row.count));
}

function formatNumber(value: number) {
  return value.toLocaleString("ja-JP");
}

function WowLine({ value, unit = "%" }: { value: number | null | undefined; unit?: string }) {
  if (value == null) return <span className="org-ga__wow is-none">前週比 —</span>;
  const up = value > 0;
  const down = value < 0;
  const abs = Math.abs(value);
  const shown = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return (
    <span className={cn("org-ga__wow", up && "is-up", down && "is-down")}>
      {up ? "↑" : down ? "↓" : "→"} {up ? "+" : down ? "−" : ""}
      {shown}
      {unit} 前週比
    </span>
  );
}

export function OrganizerGameAnalytics() {
  const params = useParams();
  const router = useRouter();
  const gameId = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<GameAnalytics | null>(null);
  const [games, setGames] = useState<OrganizerGame[]>([]);
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setTab("overview");
      const res = await fetchWithTimeout(`/api/organizer/games/${gameId}/analytics`, { cache: "no-store" }, 10000);
      const json = (await res.json().catch(() => ({}))) as GameAnalytics & { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error || "分析を読み込めませんでした");
        setData(null);
      } else {
        setData(json);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/organizer/games", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { games?: OrganizerGame[] };
      if (cancelled || !res.ok) return;
      setGames(json.games ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const gameOptions = useMemo(() => {
    const map = new Map(games.map((item) => [item.id, item]));
    if (data?.game && !map.has(data.game.id)) map.set(data.game.id, data.game);
    return [...map.values()];
  }, [games, data?.game]);

  useEffect(() => {
    setSwitchOpen(false);
  }, [gameId]);

  useEffect(() => {
    if (!switchOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (switchRef.current && !switchRef.current.contains(event.target as Node)) {
        setSwitchOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSwitchOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [switchOpen]);

  if (loading) {
    return (
      <div className="org-ga__empty" aria-busy>
        <div className={styles.mascot} aria-hidden>
          <img src="/organizer/games/loading-mascot-1.png" alt="" width={380} height={500} />
          <img src="/organizer/games/loading-mascot-2.png" alt="" width={380} height={500} />
          <img src="/organizer/games/loading-mascot-3.png" alt="" width={380} height={500} />
        </div>
        <p>歩いた跡を集計しています…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="org-ga__empty">
        <p>{error ?? "分析が見つかりません"}</p>
        <Link href="/organizer/games" className="org-games__create">
          ゲーム機能に戻る
        </Link>
      </div>
    );
  }

  const { game, kpi } = data;
  const isQuiz = game.type === "quiz";
  const go = (id: TabId) => setTab(id);

  return (
    <div className="org-ga">
      <header className="org-ga__hero">
        <div className="org-ga__hero-copy">
          <Link href="/organizer/games" className="org-ga__crumb">
            ゲーム管理
          </Link>
          <div className="org-ga__hero-row">
            <div className="org-ga__switch" ref={switchRef}>
              <button
                type="button"
                className={cn("org-ga__switch-btn", switchOpen && "is-open")}
                aria-haspopup="listbox"
                aria-expanded={switchOpen}
                aria-label="分析するゲームを切り替える"
                onClick={() => setSwitchOpen((open) => !open)}
              >
                <span className="org-ga__switch-mark" aria-hidden>
                  <Image src={gameTypeMark(game.type)} alt="" width={64} height={64} unoptimized />
                </span>
                <strong>{game.name.trim() || "無題のゲーム"}</strong>
                <span className={cn("org-ga__status", `is-${game.status}`)}>{STATUS_LABEL[game.status]}</span>
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              {switchOpen ? (
                <ul className="org-ga__switch-menu" role="listbox" aria-label="ゲーム一覧">
                  {gameOptions.map((item) => {
                    const selected = item.id === game.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={cn(selected && "is-on")}
                          onClick={() => {
                            setSwitchOpen(false);
                            if (item.id !== game.id) {
                              router.push(`/organizer/games/${item.id}/analytics`);
                            }
                          }}
                        >
                          <span>
                            <strong>{item.name.trim() || "無題のゲーム"}</strong>
                            <em>{item.typeLabel}</em>
                          </span>
                          <span className={cn("org-ga__status", `is-${item.status}`)}>{STATUS_LABEL[item.status]}</span>
                          {selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
            <Link href={`/organizer/games/${game.id}`} className="org-ga__edit">
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              編集する
            </Link>
          </div>
        </div>
      </header>

      <nav className="org-ga__tabs" aria-label="分析の種類">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={cn("org-ga__tab", tab === item.id && "is-on")}
              onClick={() => setTab(item.id)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "overview" || tab === "people" ? <KpiGrid kpi={kpi} /> : null}

      {tab === "overview" ? (
        <>
          <div className="org-ga__row3">
            <TrendCard days={data.days} compact />
            <MixCard kpi={kpi} compact />
            <HoursCard hours={data.hours} compact onMore={() => go("hours")} />
          </div>
          <div className="org-ga__row3 is-mid">
            <QuestionsCard questions={data.questions} isQuiz={isQuiz} compact onMore={() => go("questions")} />
            <SpotsCard spots={data.spots} compact onMore={() => go("spots")} />
            <FlowCard flow={data.flow} compact onMore={() => go("spots")} />
          </div>
          <div className="org-ga__row3 is-foot">
            <VoicesCard compact onMore={() => go("survey")} />
            <PostsCard compact onMore={() => go("survey")} />
            <HintsCard hints={data.hints} compact />
          </div>
        </>
      ) : null}

      {tab === "people" ? (
        <div className="org-ga__row2">
          <TrendCard days={data.days} />
          <MixCard kpi={kpi} />
        </div>
      ) : null}

      {tab === "hours" ? <HoursCard hours={data.hours} /> : null}

      {tab === "spots" ? (
        <div className="org-ga__row2">
          <SpotsCard spots={data.spots} />
          <FlowCard flow={data.flow} />
        </div>
      ) : null}

      {tab === "questions" ? <QuestionsCard questions={data.questions} isQuiz={isQuiz} /> : null}

      {tab === "rewards" ? (
        <section className="org-ga__panel">
          <header>
            <h2>
              <Ticket className="h-4 w-4" aria-hidden />
              特典・クーポン
            </h2>
          </header>
          <p className="org-ga__muted">
            クリア特典やクーポンの利用状況は、準備中です。いまは歩いた跡の分析を先に見られます。
          </p>
        </section>
      ) : null}

      {tab === "survey" ? (
        <div className="org-ga__row2">
          <VoicesCard />
          <PostsCard />
        </div>
      ) : null}
    </div>
  );
}

function KpiGrid({ kpi }: { kpi: GameAnalytics["kpi"] }) {
  return (
    <section className="org-ga__kpis" aria-label="基本KPI">
      <KpiCard
        tone="pink"
        icon={Users}
        label="参加者数"
        value={formatNumber(kpi.participants)}
        unit="人"
        wow={kpi.wow?.participants ?? null}
      />
      <KpiCard
        tone="green"
        icon={Play}
        label="開始数"
        value={formatNumber(kpi.started)}
        unit="人"
        wow={kpi.wow.started}
      />
      <KpiCard
        tone="rose"
        icon={Flag}
        label="完走数"
        value={formatNumber(kpi.completed)}
        unit="人"
        wow={kpi.wow.completed}
      />
      <KpiCard
        tone="gold"
        icon={Trophy}
        label="完走率"
        value={`${kpi.completionRate}`}
        unit="%"
        wow={kpi.wow.completionRate}
      />
      <KpiCard
        tone="purple"
        icon={Clock}
        label="平均所要時間"
        value={kpi.avgMinutes == null ? "—" : `${kpi.avgMinutes}`}
        unit={kpi.avgMinutes == null ? "" : "分"}
        wow={kpi.wow.avgMinutes}
        wowUnit="分"
      />
      <KpiCard
        tone="teal"
        icon={Repeat2}
        label="リピーター率"
        value={`${kpi.repeaterRate}`}
        unit="%"
        wow={kpi.wow.repeaterRate}
      />
    </section>
  );
}

function KpiCard({
  tone,
  icon: Icon,
  label,
  value,
  unit,
  wow,
  wowUnit = "%",
}: {
  tone: "pink" | "green" | "rose" | "gold" | "purple" | "teal";
  icon: typeof Users;
  label: string;
  value: string;
  unit: string;
  wow: number | null;
  wowUnit?: string;
}) {
  return (
    <article className={cn("org-ga__kpi", `is-${tone}`)}>
      <p>
        <span>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {label}
      </p>
      <strong>
        {value}
        {unit ? <em>{unit}</em> : null}
      </strong>
      <WowLine value={wow} unit={wowUnit} />
    </article>
  );
}

function MoreLink({ onMore }: { onMore?: () => void }) {
  if (!onMore) return null;
  return (
    <button type="button" className="org-ga__more" onClick={onMore}>
      詳細を見る
    </button>
  );
}

function TrendCard({ days, compact }: { days: GameAnalytics["days"]; compact?: boolean }) {
  const peak = maxCount(days);
  const empty = days.every((day) => day.count === 0);
  const labels = compact
    ? days.filter((_, index) => index === 0 || index === days.length - 1 || index % Math.ceil(days.length / 5) === 0)
    : days;
  return (
    <section className="org-ga__panel org-ga__trend">
      <header>
        <h2>
          <BarChart3 className="h-4 w-4" aria-hidden />
          参加者の推移
        </h2>
        <span>日別</span>
      </header>
      <div className={cn("org-ga__bars", empty && "is-empty")} role="img" aria-label="日別の参加人数">
        {days.map((day) => (
          <div key={day.date} className="org-ga__bar">
            <b
              className={day.count === 0 ? "is-zero" : undefined}
              style={{ height: day.count === 0 ? undefined : `${Math.max(12, (day.count / peak) * 100)}%` }}
            />
            {labels.some((row) => row.date === day.date) ? <span>{day.label}</span> : <span />}
          </div>
        ))}
      </div>
      {empty && !compact ? <p className="org-ga__caption">まだ日ごとの参加はありません。</p> : null}
    </section>
  );
}

function MixCard({ kpi, compact }: { kpi: GameAnalytics["kpi"]; compact?: boolean }) {
  const first = kpi.firstTimerCount;
  const repeat = kpi.repeaterCount;
  const empty = kpi.participants === 0;
  const total = Math.max(1, first + repeat);
  const firstPct = empty ? 0 : Math.round((first / total) * 100);
  const repeatPct = empty ? 0 : kpi.repeaterRate;
  return (
    <section className="org-ga__panel org-ga__mix">
      <header>
        <h2>
          <Users className="h-4 w-4" aria-hidden />
          参加者の内訳
        </h2>
      </header>
      <div className="org-ga__mix-body">
        <div
          className={cn("org-ga__donut", empty && "is-empty")}
          style={empty ? undefined : { background: `conic-gradient(#f4a0b8 0 ${firstPct}%, #7dcea0 ${firstPct}% 100%)` }}
          aria-hidden
        >
          <div>
            <span>合計</span>
            <strong>{formatNumber(kpi.participants)}</strong>
          </div>
        </div>
        <ul>
          <li>
            <i className="is-new" />
            <div>
              <strong>新規参加</strong>
              <em>
                {empty ? 0 : Math.max(0, 100 - repeatPct)}%（{formatNumber(first)}人）
              </em>
            </div>
          </li>
          <li>
            <i className="is-rep" />
            <div>
              <strong>リピーター</strong>
              <em>
                {repeatPct}%（{formatNumber(repeat)}人）
              </em>
            </div>
          </li>
        </ul>
      </div>
      {empty && !compact ? <p className="org-ga__caption">参加者がまだいません。</p> : null}
    </section>
  );
}

function HoursCard({
  hours,
  compact,
  onMore,
}: {
  hours: GameAnalytics["hours"];
  compact?: boolean;
  onMore?: () => void;
}) {
  const peak = maxCount(hours);
  const empty = hours.every((row) => row.count === 0);
  const top = [...hours].sort((a, b) => b.count - a.count)[0];
  return (
    <section className="org-ga__panel org-ga__hours">
      <header>
        <h2>
          <Clock className="h-4 w-4" aria-hidden />
          時間帯別の参加
        </h2>
        {onMore ? <MoreLink onMore={onMore} /> : <span>時間帯別</span>}
      </header>
      <div className={cn("org-ga__bars is-hours", empty && "is-empty")} role="img" aria-label="時間帯別の参加">
        {hours.map((row) => (
          <div key={row.hour} className="org-ga__bar">
            <b
              className={cn(row.count === 0 && "is-zero", top && row.hour === top.hour && row.count > 0 && "is-peak")}
              style={{ height: row.count === 0 ? undefined : `${Math.max(12, (row.count / peak) * 100)}%` }}
            />
            <span>{row.hour}時</span>
          </div>
        ))}
      </div>
      {!empty && top && top.count > 0 ? (
        <p className="org-ga__peak">
          {top.hour}時 {formatNumber(top.count)}人
        </p>
      ) : null}
      {empty && !compact ? <p className="org-ga__caption">時間帯の偏りは、まだ見えていません。</p> : null}
    </section>
  );
}

function QuestionsCard({
  questions,
  isQuiz,
  compact,
  onMore,
}: {
  questions: GameAnalytics["questions"];
  isQuiz: boolean;
  compact?: boolean;
  onMore?: () => void;
}) {
  const shown =
    questions.length > 0
      ? questions.slice(0, compact ? 5 : 12)
      : ["Q1", "Q2", "Q3", "Q4", "Q5"].map((label, index) => ({
          key: `ghost-${index}`,
          label,
          prompt: "",
          ready: false,
        }));
  const empty = questions.length === 0;
  return (
    <section className="org-ga__panel org-ga__questions">
      <header>
        <h2>
          <HelpCircle className="h-4 w-4" aria-hidden />
          問題ごとの正答率
        </h2>
        {onMore ? <MoreLink onMore={onMore} /> : null}
      </header>
      <div className={cn("org-ga__qbars", empty && "is-empty")} role="img" aria-label="問題ごとの正答率">
        {shown.map((question) => (
          <div key={question.key} className="org-ga__qbar" title={question.prompt || undefined}>
            <em>—</em>
            <b />
            <span>{question.label}</span>
          </div>
        ))}
      </div>
      {compact ? null : (
        <p className="org-ga__caption">
          {empty
            ? isQuiz
              ? "問題を追加すると、ここに正答率が出ます。"
              : "正答率はクイズラリー向けです。スタンプラリーではスポットと回遊を見てください。"
            : "回答データは、参加者が答え始めてからここに集まります。"}
        </p>
      )}
    </section>
  );
}

function SpotsCard({
  spots,
  compact,
  onMore,
}: {
  spots: GameAnalytics["spots"];
  compact?: boolean;
  onMore?: () => void;
}) {
  const ranked = useMemo(() => [...spots].sort((a, b) => b.visits - a.visits), [spots]);
  const shown = compact ? ranked.slice(0, 5) : ranked;
  const peak = Math.max(1, ...shown.map((spot) => spot.visits));
  return (
    <section className="org-ga__panel">
      <header>
        <h2>
          <MapPin className="h-4 w-4" aria-hidden />
          人気のスポット
        </h2>
        {onMore ? <MoreLink onMore={onMore} /> : null}
      </header>
      {shown.length === 0 ? (
        <p className="org-ga__muted">{compact ? "スポットを追加すると、訪問が見えます。" : "スポットを追加すると、どこが歩かれたかが見えます。"}</p>
      ) : (
        <ol className="org-ga__spots">
          {shown.map((spot, index) => (
            <li key={spot.id}>
              <em>{index + 1}</em>
              <span className="org-ga__spot-thumb" aria-hidden>
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <div>
                <strong>{spot.name}</strong>
                <span>
                  {SPOT_KIND_LABEL[spot.kind] ?? "スポット"} ・ {formatNumber(spot.visits)}人
                </span>
              </div>
              <b>
                <i style={{ width: `${(spot.visits / peak) * 100}%` }} />
              </b>
              <var>{spot.reachRate}%</var>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function FlowCard({
  flow,
  compact,
  onMore,
}: {
  flow: GameAnalytics["flow"];
  compact?: boolean;
  onMore?: () => void;
}) {
  const shown = useMemo(() => {
    if (!compact || flow.length <= 7) return flow;
    return [flow[0], ...flow.slice(1, -1).slice(0, 4), flow[flow.length - 1]];
  }, [compact, flow]);
  return (
    <section className="org-ga__panel">
      <header>
        <h2>
          <Sparkles className="h-4 w-4" aria-hidden />
          参加者の回遊フロー
        </h2>
        {onMore ? <MoreLink onMore={onMore} /> : null}
      </header>
      <ol className="org-ga__flow">
        {shown.map((step, index) => (
          <li key={step.key} className={cn(index === 0 && "is-start", index === shown.length - 1 && "is-goal")}>
            <span />
            <div>
              <strong>{step.name}</strong>
              <em>
                {formatNumber(step.count)}人
                {index === 0 ? "（開始数）" : index === shown.length - 1 ? "（完走数）" : ""}
              </em>
            </div>
            <var>{step.rate}%</var>
          </li>
        ))}
      </ol>
    </section>
  );
}

function VoicesCard({ compact, onMore }: { compact?: boolean; onMore?: () => void }) {
  return (
    <section className="org-ga__panel">
      <header>
        <h2>
          <MessageCircle className="h-4 w-4" aria-hidden />
          参加者の声
        </h2>
        {onMore ? <MoreLink onMore={onMore} /> : null}
      </header>
      <ul className="org-ga__voices">
        <li>
          <p>{compact ? "終了後の感想は、まだ届いていません。" : "ゲーム終了後の感想は、まだ届いていません。"}</p>
          {compact ? null : <time>終了画面から残せるようにします</time>}
        </li>
      </ul>
    </section>
  );
}

function PostsCard({ compact, onMore }: { compact?: boolean; onMore?: () => void }) {
  return (
    <section className="org-ga__panel">
      <header>
        <h2>
          <Sparkles className="h-4 w-4" aria-hidden />
          人気のユーザー投稿
        </h2>
        {onMore ? (
          <button type="button" className="org-ga__more" onClick={onMore}>
            すべて見る
          </button>
        ) : null}
      </header>
      <ul className="org-ga__posts">
        {Array.from({ length: compact ? 4 : 5 }).map((_, index) => (
          <li key={index} aria-hidden />
        ))}
      </ul>
      {compact ? null : <p className="org-ga__caption">投稿とゲームがつながると、ここに写真が並びます。</p>}
    </section>
  );
}

function HintsCard({ hints, compact }: { hints: GameAnalytics["hints"]; compact?: boolean }) {
  const shown = compact ? hints.slice(0, 2) : hints;
  return (
    <section className="org-ga__panel org-ga__hints">
      <header>
        <h2>
          <Lightbulb className="h-4 w-4" aria-hidden />
          改善のヒント
        </h2>
        <span>歩き方から</span>
      </header>
      <ul>
        {shown.map((hint, index) => (
          <li key={hint.id}>
            <em>{index + 1}</em>
            <p>{hint.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
