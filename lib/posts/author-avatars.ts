import { createClient } from "@/lib/supabase/server";
import {
  resolveAvatarUrlByRole,
  type ProfileAvatarFields,
} from "@/lib/profile-avatar";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function fetchAvatarUrlsByUserIds(
  ids: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const unique = [
    ...new Set(
      ids.filter((id): id is string => Boolean(id && isUuid(id))),
    ),
  ];
  const map = new Map<string, string | null>();
  if (unique.length === 0) return map;

  const supabase = await createClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role",
    )
    .in("id", unique);

  if (error) {
    console.error("fetchAvatarUrlsByUserIds:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const fields = row as ProfileAvatarFields & { id: string };
    map.set(fields.id, resolveAvatarUrlByRole(fields));
  }
  return map;
}

export async function withAuthorAvatars<
  T extends { author_id: string | null },
>(rows: T[]): Promise<Array<T & { author_avatar_url: string | null }>> {
  const urls = await fetchAvatarUrlsByUserIds(rows.map((row) => row.author_id));
  return rows.map((row) => ({
    ...row,
    author_avatar_url: row.author_id
      ? (urls.get(row.author_id) ?? null)
      : null,
  }));
}

export async function withAuthorAvatar<
  T extends { author_id: string | null },
>(row: T): Promise<T & { author_avatar_url: string | null }> {
  const [hydrated] = await withAuthorAvatars([row]);
  return hydrated;
}
