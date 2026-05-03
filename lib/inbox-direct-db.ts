import type { InboxItem } from "./inbox-queries";
import { getDirectPostgresClientConfig } from "./direct-postgres-config";

/**
 * PostgREST を経由せず直接 DB に接続してトーク一覧を取得
 * スキーマキャッシュ問題を回避（SUPABASE_DB_URL 設定時）
 */
export async function fetchInboxDirectDb(
  userId: string,
  limit = 50
): Promise<InboxItem[]> {
  const config = getDirectPostgresClientConfig();

  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();

    const queryWithRoleAvatars = `
      WITH my_conversations AS (
        SELECT cm.conversation_id, cm.last_read_at
        FROM public.conversation_members cm
        WHERE cm.user_id = $1
      ),
      convs_with_org AS (
        SELECT
          c.id,
          c.kind,
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
        cwo.kind AS conversation_kind,
        ou.event_id AS event_id,
        ev.title AS event_title,
        ou.other_id AS other_user_id,
        CASE
          WHEN cwo.organizer_profile_id = $1 THEN 'organizer'
          ELSE 'volunteer'
        END AS my_role,
        p.display_name AS other_display_name,
        p.email AS other_email,
        p.avatar_url AS other_avatar_url,
        p.participant_avatar_url AS other_participant_avatar_url,
        p.organizer_avatar_url AS other_organizer_avatar_url,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at,
        COALESCE(uc.cnt, 0) AS unread_count
      FROM other_users ou
      JOIN convs_with_org cwo ON cwo.id = ou.conv_id
      LEFT JOIN public.events ev ON ev.id = ou.event_id
      JOIN public.profiles p ON p.id = ou.other_id
      LEFT JOIN last_msgs lm ON lm.conversation_id = ou.conv_id
      LEFT JOIN unread_cnt uc ON uc.conversation_id = ou.conv_id
      ORDER BY lm.created_at DESC NULLS LAST
      LIMIT $2
    `;
    const queryLegacy = queryWithRoleAvatars
      .replace(
        "p.participant_avatar_url AS other_participant_avatar_url,",
        "NULL::text AS other_participant_avatar_url,"
      )
      .replace(
        "p.organizer_avatar_url AS other_organizer_avatar_url,",
        "NULL::text AS other_organizer_avatar_url,"
      );

    let result;
    try {
      result = await client.query(queryWithRoleAvatars, [userId, limit]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // マイグレーション未適用環境では新カラム参照で失敗するため旧SQLで継続
      if (/participant_avatar_url|organizer_avatar_url|42703/i.test(msg)) {
        result = await client.query(queryLegacy, [userId, limit]);
      } else {
        throw e;
      }
    }

    return (result.rows ?? []).map((row) => ({
      conversation_id: row.conversation_id,
      conversation_kind: row.conversation_kind ?? null,
      event_id: row.event_id ?? null,
      event_title: row.event_title ?? null,
      other_user_id: row.other_user_id,
      other_display_name: row.other_display_name ?? null,
      other_email: row.other_email ?? null,
      other_avatar_url: row.other_avatar_url ?? null,
      other_participant_avatar_url: row.other_participant_avatar_url ?? null,
      other_organizer_avatar_url: row.other_organizer_avatar_url ?? null,
      last_message_content: row.last_message_content ?? null,
      last_message_at: row.last_message_at ?? null,
      unread_count: Number(row.unread_count ?? 0),
      my_role: row.my_role === "organizer" ? "organizer" : "volunteer",
    }));
  } finally {
    await client.end();
  }
}
