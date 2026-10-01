import { createAdminClient } from "@/lib/supabase/admin";
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

type AuthorFace = {
  avatarUrl: string | null;
  displayName: string | null;
};

async function fetchAuthorFacesByUserIds(
  ids: Array<string | null | undefined>,
): Promise<Map<string, AuthorFace>> {
  const unique = [
    ...new Set(
      ids.filter((id): id is string => Boolean(id && isUuid(id))),
    ),
  ];
  const map = new Map<string, AuthorFace>();
  if (unique.length === 0) return map;

  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role",
    )
    .in("id", unique);

  if (error) {
    console.error("fetchAuthorFacesByUserIds:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const fields = row as ProfileAvatarFields & { id: string };
    const displayName = fields.display_name?.trim() || null;
    map.set(fields.id, {
      avatarUrl: resolveAvatarUrlByRole(fields),
      displayName,
    });
  }
  return map;
}

export async function fetchAvatarUrlsByUserIds(
  ids: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const faces = await fetchAuthorFacesByUserIds(ids);
  const map = new Map<string, string | null>();
  for (const [id, face] of faces) map.set(id, face.avatarUrl);
  return map;
}

export async function withAuthorAvatars<
  T extends { author_id: string | null; author_display_name?: string },
>(rows: T[]): Promise<Array<T & { author_avatar_url: string | null }>> {
  const faces = await fetchAuthorFacesByUserIds(
    rows.map((row) => row.author_id),
  );
  return rows.map((row) => {
    const face = row.author_id ? faces.get(row.author_id) : undefined;
    const displayName = face?.displayName;
    return {
      ...row,
      author_avatar_url: face?.avatarUrl ?? null,
      ...("author_display_name" in row && displayName
        ? { author_display_name: displayName }
        : {}),
    };
  });
}

export async function withAuthorAvatar<
  T extends { author_id: string | null },
>(row: T): Promise<T & { author_avatar_url: string | null }> {
  const [hydrated] = await withAuthorAvatars([row]);
  return hydrated;
}
