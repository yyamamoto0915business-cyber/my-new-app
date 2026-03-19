import type { InboxItem } from "./inbox-queries";

/**
 * PostgREST を経由せず直接 DB に接続してトーク一覧を取得
 * スキーマキャッシュ問題を回避（SUPABASE_DB_URL 設定時）
 */
function getDbConfig() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL または DATABASE_URL が設定されていません");
  }

  if (dbPassword) {
    try {
      const url = new URL(dbUrl.replace(/^postgres(ql)?:\/\//, "https://"));
      return {
        host: url.hostname,
        port: parseInt(url.port || "6543", 10),
        user: url.username || "postgres",
        password: dbPassword,
        database: url.pathname.slice(1) || "postgres",
        ssl: { rejectUnauthorized: false },
      };
    } catch {
      // fallback
    }
  }

  return {
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  };
}

export async function fetchInboxDirectDb(
  userId: string,
  limit = 50
): Promise<InboxItem[]> {
  const config = getDbConfig();

  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();

    const result = await client.query(
      `
      WITH my_conversations AS (
        SELECT cm.conversation_id, cm.last_read_at
        FROM public.conversation_members cm
        WHERE cm.user_id = $1
      ),
      convs_with_org AS (
        SELECT
          c.id,
          c.event_id,
          c.organizer_id,
          c.other_user_id,
          o.profile_id AS organizer_profile_id
        FROM public.conversations c
        JOIN public.organizers o ON o.id = c.organizer_id
        WHERE c.id IN (SELECT conversation_id FROM my_conversations)
      ),
      other_users AS (
        SELECT
          cwo.id AS conv_id,
          cwo.event_id,
          CASE
            WHEN cwo.organizer_profile_id = $1 THEN cwo.other_user_id
            ELSE cwo.organizer_profile_id
          END AS other_id
        FROM convs_with_org cwo
      ),
      last_msgs AS (
        SELECT DISTINCT ON (m.conversation_id)
          m.conversation_id,
          m.content,
          m.created_at,
          m.sender_id
        FROM public.messages m
        WHERE m.conversation_id IN (SELECT conversation_id FROM my_conversations)
        ORDER BY m.conversation_id, m.created_at DESC
      ),
      unread_cnt AS (
        SELECT
          mc.conversation_id,
          COUNT(*)::int AS cnt
        FROM my_conversations mc
        JOIN public.messages m ON m.conversation_id = mc.conversation_id
        WHERE m.sender_id != $1
          AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
        GROUP BY mc.conversation_id
      )
      SELECT
        ou.conv_id AS conversation_id,
        ou.event_id AS event_id,
        ev.title AS event_title,
        ou.other_id AS other_user_id,
        p.display_name AS other_display_name,
        p.avatar_url AS other_avatar_url,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at,
        COALESCE(uc.cnt, 0) AS unread_count
      FROM other_users ou
      LEFT JOIN public.events ev ON ev.id = ou.event_id
      JOIN public.profiles p ON p.id = ou.other_id
      LEFT JOIN last_msgs lm ON lm.conversation_id = ou.conv_id
      LEFT JOIN unread_cnt uc ON uc.conversation_id = ou.conv_id
      ORDER BY lm.created_at DESC NULLS LAST
      LIMIT $2
      `,
      [userId, limit]
    );

    return (result.rows ?? []).map((row) => ({
      conversation_id: row.conversation_id,
      event_id: row.event_id ?? null,
      event_title: row.event_title ?? null,
      other_user_id: row.other_user_id,
      other_display_name: row.other_display_name ?? null,
      other_avatar_url: row.other_avatar_url ?? null,
      last_message_content: row.last_message_content ?? null,
      last_message_at: row.last_message_at ?? null,
      unread_count: Number(row.unread_count ?? 0),
    }));
  } finally {
    await client.end();
  }
}
