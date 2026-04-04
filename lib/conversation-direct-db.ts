import { getDirectPostgresClientConfig } from "./direct-postgres-config";

export type ConversationMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ConversationMetaDirect = {
  eventId: string | null;
  eventTitle: string | null;
  organizerDisplayName: string | null;
  organizerAvatarUrl: string | null;
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

    const result = await client.query(
      `
      SELECT
        c.event_id AS event_id,
        ev.title AS event_title,
        pr.display_name AS organizer_display_name,
        pr.avatar_url AS organizer_avatar_url
      FROM public.conversations c
      INNER JOIN public.conversation_members cm
        ON cm.conversation_id = c.id AND cm.user_id = $2::uuid
      LEFT JOIN public.events ev ON ev.id = c.event_id
      INNER JOIN public.organizers o ON o.id = c.organizer_id
      LEFT JOIN public.profiles pr ON pr.id = o.profile_id
      WHERE c.id = $1::uuid
      `,
      [conversationId, userId]
    );

    if ((result.rowCount ?? 0) === 0) return null;

    const row = result.rows[0] as {
      event_id: string | null;
      event_title: string | null;
      organizer_display_name: string | null;
      organizer_avatar_url: string | null;
    };

    return {
      eventId: row.event_id,
      eventTitle: row.event_title,
      organizerDisplayName: row.organizer_display_name,
      organizerAvatarUrl: row.organizer_avatar_url,
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
