import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getApiUser } from "@/lib/api-auth";
import { getLoginUrl } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";
import styles from "./points.module.css";

export const metadata: Metadata = {
  title: "マイポイント | MachiGlyph",
  description: "保有ポイントと、受け取ったバッジを確認できます",
};

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
  const [{ data: points }, { data: transactions }, { data: badges }] = supabase
    ? await Promise.all([
        supabase.from("user_points").select("balance").eq("user_id", user.id).maybeSingle(),
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
    : [{ data: null }, { data: null }, { data: null }];

  const balance = typeof points?.balance === "number" ? points.balance : 0;
  const history = (transactions ?? []) as TransactionRow[];
  const owned = (badges ?? []) as BadgeRow[];

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>アカウント</p>
        <h1 className={styles.title}>マイポイント</h1>
        <section className={styles.balance}>
          <span>保有ポイント</span>
          <strong>{balance.toLocaleString("ja-JP")}</strong>
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
