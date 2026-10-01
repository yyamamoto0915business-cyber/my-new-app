import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
} from "@/lib/profile-avatar";

export type UserSearchHit = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  region: string | null;
  isPrivate: boolean;
  followStatus: "none" | "pending" | "accepted" | "rejected" | "self";
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  participant_avatar_url: string | null;
  organizer_avatar_url: string | null;
  active_profile_role: string | null;
  region: string | null;
  is_private: boolean | null;
};

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "");
}

export async function searchUsersByName(
  rawQuery: string,
  viewerId: string | null,
): Promise<UserSearchHit[]> {
  const query = escapeIlike(rawQuery.trim()).slice(0, 40);
  if (!query) return [];

  const client = createAdminClient() ?? (await createClient());
  if (!client) return [];

  const { data, error } = await client
    .from("profiles")
    .select(
      "id, display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role, region, is_private",
    )
    .ilike("display_name", `%${query}%`)
    .limit(20);
  if (error) {
    console.error("searchUsersByName:", error.message);
    return [];
  }

  const rows = (data ?? []) as ProfileRow[];
  const followById = await followStatusMap(
    viewerId,
    rows.map((row) => row.id),
  );

  return rows
    .map((row): UserSearchHit => {
      const displayName = row.display_name?.trim() || "ユーザー";
      return {
        id: row.id,
        displayName,
        avatarUrl: resolveAvatarUrlByRole(
          {
            avatar_url: row.avatar_url,
            participant_avatar_url: row.participant_avatar_url,
            organizer_avatar_url: row.organizer_avatar_url,
          },
          normalizeProfileAvatarRole(row.active_profile_role),
        ),
        region: row.region?.trim() || null,
        isPrivate: Boolean(row.is_private),
        followStatus:
          viewerId && viewerId === row.id
            ? ("self" as const)
            : (followById.get(row.id) ?? "none"),
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
}

async function followStatusMap(
  viewerId: string | null,
  followeeIds: string[],
): Promise<Map<string, "pending" | "accepted" | "rejected">> {
  const map = new Map<string, "pending" | "accepted" | "rejected">();
  if (!viewerId || followeeIds.length === 0) return map;

  const supabase = await createClient();
  if (!supabase) return map;
  const { data, error } = await supabase
    .from("user_follows")
    .select("followee_id, status")
    .eq("follower_id", viewerId)
    .in("followee_id", followeeIds);
  if (error) return map;
  for (const row of data ?? []) {
    const status = (row as { status?: string }).status;
    const id = (row as { followee_id?: string }).followee_id;
    if (!id) continue;
    if (status === "pending" || status === "accepted" || status === "rejected") {
      map.set(id, status);
    }
  }
  return map;
}
