import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getApiUser } from "@/lib/api-auth";
import { getLoginUrl } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";
import styles from "./points.module.css";
import { fetchMyEventPoints, usableUntilLabel, type EventPointsItem } from "@/lib/points/event-points";

export const metadata: Metadata = {
  title: "イベントポイント | MachiGlyph",
  description: "イベントで使えるポイントと、受け取ったバッジを確認できます",
};

function EventPointRow({ item, note }: { item: EventPointsItem; note: string }) {
  return (
    <li>
      <div>
        <b>{item.title}</b>
        <small>{note}</small>
      </div>
      <span className={styles.plus}>{item.balance.toLocaleString("ja-JP")}pt</span>
    </li>
  );
}

type TransactionRow = {
  id: string;
  amount: number;
  type: string;
  reference_id: string | null;
  created_at: string;
};

type BadgeRow = {
  id: string;
  label: string;
  image_url: string;
  awarded_at: string;
};

function transactionLabel(row: TransactionRow): string {
  if (row.reference_id?.startsWith("stamp-rally:")) return "スタンプラリー";
  if (row.reference_id?.startsWith("photo:")) return "フォトラリー";
  if (row.reference_id?.startsWith("checkin:")) return "チェックイン";
  if (row.reference_id?.startsWith("mission:")) return "ミッション";
  if (row.type === "spend") return "利用";
  if (row.type === "exchange") return "交換";
  return "獲得";
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function PointsPage() {
  const user = await getApiUser();
  if (!user) redirect(getLoginUrl("/points"));

  const supabase = await createClient();
  const [eventPoints, { data: transactions }, { data: badges }] = supabase
    ? await Promise.all([
        fetchMyEventPoints(supabase, user.id),
        supabase
          .from("point_transactions")
          .select("id, amount, type, reference_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("user_badges")
          .select("id, label, image_url, awarded_at")
          .eq("user_id", user.id)
          .order("awarded_at", { ascending: false }),
      ])
    : [{ usable: [], ended: [], unlinked: 0, totalEarned: 0 }, { data: null }, { data: null }];

  const history = (transactions ?? []) as TransactionRow[];
  const owned = (badges ?? []) as BadgeRow[];

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>ポイント・バッジ</p>
        <h1 className={styles.title}>イベントポイント</h1>
        <p className={styles.empty}>
          ポイントは、イベントのゲーム（スタンプラリーなど）をクリアするともらえます。もらったイベントの開催中に、そのイベントで使えます。
        </p>

        <section className={styles.section}>
          <h2>使えるポイント</h2>
          {eventPoints.usable.length === 0 ? (
            <p className={styles.empty}>いま使えるポイントはありません。</p>
          ) : (
            <ul className={styles.list}>
              {eventPoints.usable.map((item) => (
                <EventPointRow
                  key={item.eventId}
                  item={item}
                  note={item.status === "live" ? `開催中・${usableUntilLabel(item)}` : `開催前・${usableUntilLabel(item)}`}
                />
              ))}
            </ul>
          )}
        </section>

        {eventPoints.ended.length > 0 ? (
          <section className={styles.section}>
            <h2>終わったイベント（記録）</h2>
            <ul className={styles.list}>
              {eventPoints.ended.map((item) => (
                <EventPointRow key={item.eventId} item={{ ...item, balance: item.earned }} note="ためたポイント・今は使えません" />
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.balance}>
          <span>これまでにためたポイント</span>
          <strong>{eventPoints.totalEarned.toLocaleString("ja-JP")}</strong>
        </section>

        <section className={styles.section}>
          <h2>履歴</h2>
          {history.length === 0 ? (
            <p className={styles.empty}>まだポイントの出入りはありません。ゲームをクリアすると、ここに残ります。</p>
          ) : (
            <ul className={styles.list}>
              {history.map((row) => (
                <li key={row.id}>
                  <div>
                    <b>{transactionLabel(row)}</b>
                    <small>{formatWhen(row.created_at)}</small>
                  </div>
                  <span className={styles.plus}>
                    {row.amount > 0 ? "+" : ""}
                    {row.amount.toLocaleString("ja-JP")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} id="badges">
          <h2>もらったバッジ</h2>
          {owned.length === 0 ? (
            <p className={styles.empty}>まだバッジはありません。バッジが特典のラリーをクリアすると、ここに残ります。</p>
          ) : (
            <ul className={styles.badges}>
              {owned.map((badge) => (
                <li key={badge.id} className={styles.medal}>
                  {badge.image_url ? <img src={badge.image_url} alt="" /> : <span>{badge.label}</span>}
                  <small>{formatWhen(badge.awarded_at)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
