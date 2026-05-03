import { getDirectPostgresClientConfig } from "./direct-postgres-config";

/** conversations 一意キー用（SQL リテラルと揃える） */
const ZERO_UUID_SQL = "'00000000-0000-0000-0000-000000000000'::uuid";

export type CreateOrGetConversationDirectParams = {
  callerUserId: string;
  /** RPC と同じく、無イベントは `00000000-0000-0000-0000-000000000000` */
  eventId: string;
  kind: string;
  organizerId: string;
  otherUserId: string;
};

function pgErrorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

/**
 * 1 クエリのみ（トランザクションなし）→ Supabase Transaction プーラー（6543）でも動きやすい。
 * DB 側の SECURITY DEFINER 関数をそのまま呼ぶ。
 */
async function createOrGetConversationDirectDbViaDbRpc(
  params: CreateOrGetConversationDirectParams
): Promise<string> {
  const { callerUserId, eventId, kind, organizerId, otherUserId } = params;
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);
  await client.connect();
  try {
    const r = await client.query(
      `
      SELECT public.create_or_get_conversation_for_user(
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::uuid,
        $5::uuid
      ) AS conversation_id
      `,
      [callerUserId, eventId, kind, organizerId, otherUserId]
    );
    const id = r.rows[0]?.conversation_id as string | undefined;
    if (!id) {
      throw new Error("conversation upsert did not resolve id");
    }
    return id;
  } finally {
    await client.end();
  }
}

/**
 * 旧経路: 複数文トランザクション。Session モード（5432）向け。プーラーでは失敗しうる。
 */
async function createOrGetConversationDirectDbLegacyTransaction(
  params: CreateOrGetConversationDirectParams
): Promise<string> {
  const { callerUserId, eventId, kind, organizerId, otherUserId } = params;
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  await client.connect();
  try {
    await client.query("BEGIN");

    const orgRes = await client.query(
      `SELECT profile_id FROM public.organizers WHERE id = $1::uuid`,
      [organizerId]
    );
    if ((orgRes.rowCount ?? 0) === 0) {
      throw new Error("organizer not found");
    }
    const organizerProfileId = orgRes.rows[0].profile_id as string;

    if (
      callerUserId !== organizerProfileId &&
      callerUserId !== otherUserId
    ) {
      throw new Error("not allowed to create this conversation");
    }

    await client.query(
      `
      INSERT INTO public.conversations (event_id, kind, organizer_id, other_user_id)
      VALUES (
        NULLIF($1::uuid, ${ZERO_UUID_SQL}),
        $2::text,
        $3::uuid,
        $4::uuid
      )
      ON CONFLICT (
        (COALESCE(event_id, ${ZERO_UUID_SQL})),
        kind,
        organizer_id,
        other_user_id
      )
      DO NOTHING
      `,
      [eventId, kind, organizerId, otherUserId]
    );

    const sel = await client.query(
      `
      SELECT id FROM public.conversations
      WHERE COALESCE(event_id, ${ZERO_UUID_SQL})
          = COALESCE(NULLIF($1::uuid, ${ZERO_UUID_SQL}), ${ZERO_UUID_SQL})
        AND kind = $2::text
        AND organizer_id = $3::uuid
        AND other_user_id = $4::uuid
      `,
      [eventId, kind, organizerId, otherUserId]
    );

    if ((sel.rowCount ?? 0) === 0) {
      throw new Error("conversation upsert did not resolve id");
    }

    const convId = sel.rows[0].id as string;

    await client.query(
      `
      INSERT INTO public.conversation_members (conversation_id, user_id)
      VALUES ($1::uuid, $2::uuid), ($1::uuid, $3::uuid)
      ON CONFLICT (conversation_id, user_id) DO NOTHING
      `,
      [convId, organizerProfileId, otherUserId]
    );

    await client.query("COMMIT");
    return convId;
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    throw e;
  } finally {
    await client.end();
  }
}

/**
 * create_or_get_conversation_for_user と同等（RLS/JWT を経由しない）。
 * 本番で SUPABASE_DB_URL があるとき会話作成の信頼できる経路にする。
 *
 * 優先: DB 内 RPC を 1 クエリで呼ぶ（Transaction プーラー対策）。
 * フォールバック: 手組み INSERT トランザクション（Session 直結向け）。
 */
export async function createOrGetConversationDirectDb(
  params: CreateOrGetConversationDirectParams
): Promise<string> {
  try {
    return await createOrGetConversationDirectDbViaDbRpc(params);
  } catch (e) {
    const code = pgErrorCode(e);
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    const useLegacy =
      code === "42883" ||
      code === "42501" ||
      /does not exist|permission denied|must be owner|42883|42501/i.test(msg);

    if (useLegacy) {
      console.warn(
        "[createOrGetConversationDirectDb] single-RPC call failed, trying legacy transaction",
        { code, snippet: msg.slice(0, 120) }
      );
      return await createOrGetConversationDirectDbLegacyTransaction(params);
    }
    throw e;
  }
}

export type ConversationMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ConversationMetaDirect = {
  conversationKind: string | null;
  eventId: string | null;
  eventTitle: string | null;
  organizerDisplayName: string | null;
  organizerAvatarUrl: string | null;
  organizerParticipantAvatarUrl: string | null;
  organizerOrganizerAvatarUrl: string | null;
  organizerProfileId: string | null;
  otherUserId: string | null;
};

/**
 * 会話メンバーでない場合は null（403 相当）
 */
export async function fetchConversationMessagesDirectDb(
  userId: string,
  conversationId: string
): Promise<ConversationMessageRow[] | null> {
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();

    const mem = await client.query(
      `SELECT 1 FROM public.conversation_members WHERE conversation_id = $1::uuid AND user_id = $2::uuid`,
      [conversationId, userId]
    );
    if ((mem.rowCount ?? 0) === 0) return null;

    const result = await client.query(
      `
      SELECT id, conversation_id, sender_id, content, created_at
      FROM public.messages
      WHERE conversation_id = $1::uuid
      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    return (result.rows ?? []).map((row) => ({
      id: row.id as string,
      conversation_id: row.conversation_id as string,
      sender_id: row.sender_id as string,
      content: row.content as string,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    }));
  } finally {
    await client.end();
  }
}

/**
 * 会話メンバーでない / 会話なしは null（404 相当）
 */
export async function fetchConversationMetaDirectDb(
  userId: string,
  conversationId: string
): Promise<ConversationMetaDirect | null> {
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();

    const queryWithRoleAvatars = `
      SELECT
        c.kind AS conversation_kind,
        c.event_id AS event_id,
        c.other_user_id AS other_user_id,
        ev.title AS event_title,
        o.profile_id AS organizer_profile_id,
        pr.display_name AS organizer_display_name,
        pr.avatar_url AS organizer_avatar_url,
        pr.participant_avatar_url AS organizer_participant_avatar_url,
        pr.organizer_avatar_url AS organizer_organizer_avatar_url
      FROM public.conversations c
      INNER JOIN public.conversation_members cm
        ON cm.conversation_id = c.id AND cm.user_id = $2::uuid
      LEFT JOIN public.events ev ON ev.id = c.event_id
      INNER JOIN public.organizers o ON o.id = c.organizer_id
      LEFT JOIN public.profiles pr ON pr.id = o.profile_id
      WHERE c.id = $1::uuid
    `;
    const queryLegacy = queryWithRoleAvatars
      .replace(
        "pr.participant_avatar_url AS organizer_participant_avatar_url,",
        "NULL::text AS organizer_participant_avatar_url,"
      )
      .replace(
        "pr.organizer_avatar_url AS organizer_organizer_avatar_url",
        "NULL::text AS organizer_organizer_avatar_url"
      );

    let result;
    try {
      result = await client.query(queryWithRoleAvatars, [conversationId, userId]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/participant_avatar_url|organizer_avatar_url|42703/i.test(msg)) {
        result = await client.query(queryLegacy, [conversationId, userId]);
      } else {
        throw e;
      }
    }

    if ((result.rowCount ?? 0) === 0) return null;

    const row = result.rows[0] as {
      conversation_kind: string | null;
      event_id: string | null;
      other_user_id: string | null;
      event_title: string | null;
      organizer_profile_id: string | null;
      organizer_display_name: string | null;
      organizer_avatar_url: string | null;
      organizer_participant_avatar_url: string | null;
      organizer_organizer_avatar_url: string | null;
    };

    return {
      conversationKind: row.conversation_kind,
      eventId: row.event_id,
      eventTitle: row.event_title,
      organizerDisplayName: row.organizer_display_name,
      organizerAvatarUrl: row.organizer_avatar_url,
      organizerParticipantAvatarUrl: row.organizer_participant_avatar_url,
      organizerOrganizerAvatarUrl: row.organizer_organizer_avatar_url,
      organizerProfileId: row.organizer_profile_id,
      otherUserId: row.other_user_id,
    };
  } finally {
    await client.end();
  }
}

export async function markConversationReadDirectDb(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();
    const result = await client.query(
      `
      UPDATE public.conversation_members
      SET last_read_at = NOW()
      WHERE conversation_id = $1::uuid AND user_id = $2::uuid
      `,
      [conversationId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    await client.end();
  }
}

/**
 * メンバーでない場合は false（メッセージ行は増えない）
 */
export async function insertConversationMessageDirectDb(
  userId: string,
  conversationId: string,
  content: string
): Promise<boolean> {
  const config = getDirectPostgresClientConfig();
  const { default: pg } = await import("pg");
  const client = new pg.Client(config);

  try {
    await client.connect();
    const result = await client.query(
      `
      INSERT INTO public.messages (conversation_id, sender_id, content)
      SELECT $1::uuid, $2::uuid, $3::text
      WHERE EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = $1::uuid AND cm.user_id = $2::uuid
      )
      RETURNING id
      `,
      [conversationId, userId, content]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    await client.end();
  }
}
