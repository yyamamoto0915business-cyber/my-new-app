import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/db/notifications";
import type { MyPostItem } from "@/app/api/me/posts/route";
import {
  getCommunityPostAccess,
  getCommunityPostsByIds,
} from "@/lib/db/community-posts";
import type { DbCommunityPost } from "@/lib/db/community-posts-types";
import { isAcceptedFollower, listAcceptedFollowers, listAcceptedFollowing } from "@/lib/db/user-follows";
import {
  addMemorySharedAlbum,
  addMemorySharedAlbumItem,
  addMemorySharedAlbumMember,
  countMemorySharedAlbumsOwned,
  deleteMemorySharedAlbum,
  deleteMemorySharedAlbumItem,
  getMemorySharedAlbum,
  getMemorySharedAlbumByToken,
  getMemorySharedAlbumItem,
  getMemorySharedAlbumMember,
  listMemorySharedAlbumItems,
  listMemorySharedAlbumMembers,
  listMemorySharedAlbumsForUser,
  updateMemorySharedAlbum,
  type MemorySharedAlbum,
  type MemorySharedAlbumItem,
  type MemorySharedAlbumMember,
} from "@/lib/created-shared-albums-store";
import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import { toMyPostItem } from "@/lib/posts/to-my-post-item";
import {
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
  type ProfileAvatarFields,
} from "@/lib/profile-avatar";
import type {
  SharedAlbumDetail,
  SharedAlbumInvitee,
  SharedAlbumItemView,
  SharedAlbumMember,
  SharedAlbumSummary,
} from "@/lib/posts/shared-album-types";

export const MAX_SHARED_ALBUMS_OWNED = 30;
export const MAX_SHARED_ALBUM_ITEMS = 80;
export const MAX_SHARED_ALBUM_MEMBERS = 12;
export const MAX_ALBUM_TITLE = 40;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isMissingTable(message: string | undefined): boolean {
  return Boolean(message && /schema cache|does not exist|42P01/i.test(message));
}

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

async function writer() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

type AlbumRow = MemorySharedAlbum;
type MemberRow = MemorySharedAlbumMember;
type ItemRow = MemorySharedAlbumItem;

type ProfileLite = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

async function loadProfiles(ids: string[]): Promise<Map<string, ProfileLite>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProfileLite>();
  if (unique.length === 0) return map;

  const supabase = (await writer()) ?? (await createClient());
  const uuids = unique.filter(isUuid);
  if (supabase && uuids.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role",
      )
      .in("id", uuids);
    if (!error) {
      for (const row of data ?? []) {
        const fields = row as ProfileAvatarFields & {
          id: string;
          display_name: string | null;
        };
        map.set(fields.id, {
          id: fields.id,
          displayName: fields.display_name?.trim() || "ユーザー",
          avatarUrl: resolveAvatarUrlByRole(
            fields,
            normalizeProfileAvatarRole(fields.active_profile_role),
          ),
        });
      }
    }
  }

  for (const id of unique) {
    if (!map.has(id)) {
      map.set(id, { id, displayName: "ユーザー", avatarUrl: null });
    }
  }
  return map;
}

function toMember(
  row: MemberRow,
  profile: ProfileLite | undefined,
): SharedAlbumMember {
  return {
    userId: row.user_id,
    displayName: profile?.displayName ?? "ユーザー",
    avatarUrl: profile?.avatarUrl ?? null,
    role: row.role,
  };
}

async function toSummary(
  album: AlbumRow,
  memberRows: MemberRow[],
  itemCount: number,
  viewerId: string,
  profiles: Map<string, ProfileLite>,
): Promise<SharedAlbumSummary> {
  return {
    id: album.id,
    title: album.title,
    coverUrl: album.cover_url,
    photoCount: itemCount,
    members: memberRows.map((m) => toMember(m, profiles.get(m.user_id))),
    isOwner: album.owner_id === viewerId,
  };
}

function trimTitle(raw: string): string | null {
  const title = raw.trim().replace(/\s+/g, " ");
  if (!title || title.length > MAX_ALBUM_TITLE) return null;
  return title;
}

async function readAlbum(id: string): Promise<AlbumRow | null> {
  const memory = getMemorySharedAlbum(id);
  const client = await writer();
  if (!client || !isUuid(id)) return memory;
  const { data, error } = await client
    .from("shared_albums")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("readAlbum:", error.message);
    }
    return memory;
  }
  return (data as AlbumRow | null) ?? memory;
}

async function readMembers(albumId: string): Promise<MemberRow[]> {
  const memory = listMemorySharedAlbumMembers(albumId);
  const client = await writer();
  if (!client || !isUuid(albumId)) return memory;
  const { data, error } = await client
    .from("shared_album_members")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: true });
  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("readMembers:", error.message);
    }
    return memory;
  }
  return ((data ?? []) as MemberRow[]).length > 0
    ? ((data ?? []) as MemberRow[])
    : memory;
}

async function readItems(albumId: string): Promise<ItemRow[]> {
  const memory = listMemorySharedAlbumItems(albumId);
  const client = await writer();
  if (!client || !isUuid(albumId)) return memory;
  const { data, error } = await client
    .from("shared_album_items")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("readItems:", error.message);
    }
    return memory;
  }
  return ((data ?? []) as ItemRow[]).length > 0
    ? ((data ?? []) as ItemRow[])
    : memory;
}

async function refreshCover(albumId: string): Promise<void> {
  const itemRows = await readItems(albumId);
  let coverUrl: string | null = null;
  if (itemRows[0]) {
    const posts = await loadPosts([itemRows[0].post_id]);
    coverUrl = posts.get(itemRows[0].post_id)?.imageUrl ?? null;
  }
  updateMemorySharedAlbum(albumId, { cover_url: coverUrl });
  const client = await writer();
  if (client && isUuid(albumId)) {
    await client
      .from("shared_albums")
      .update({ cover_url: coverUrl, updated_at: new Date().toISOString() })
      .eq("id", albumId);
  }
}

async function loadPosts(ids: string[]): Promise<Map<string, MyPostItem>> {
  const map = new Map<string, MyPostItem>();
  for (const id of ids) {
    const demo = MY_POSTS_DEMO.find((p) => p.id === id);
    if (demo) map.set(id, demo);
  }
  const missing = ids.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  const client = (await writer()) ?? (await createClient());
  const uuids = missing.filter(isUuid);
  if (client && uuids.length > 0) {
    const { data, error } = await client
      .from("community_posts")
      .select("*")
      .in("id", uuids);
    if (error) {
      console.error("loadPosts:", error.message);
    } else {
      for (const row of (data ?? []) as DbCommunityPost[]) {
        map.set(row.id, toMyPostItem(row));
      }
    }
  }

  const still = missing.filter((id) => !map.has(id));
  if (still.length > 0) {
    const rows = await getCommunityPostsByIds(still);
    for (const row of rows) map.set(row.id, toMyPostItem(row));
  }
  return map;
}

export async function listSharedAlbumsForUser(
  userId: string,
  peerId?: string | null,
): Promise<SharedAlbumSummary[]> {
  const memory = listMemorySharedAlbumsForUser(userId);
  const client = await writer();
  let rows: AlbumRow[] = memory;

  if (client && isUuid(userId)) {
    const { data: memberRows, error: memberError } = await client
      .from("shared_album_members")
      .select("album_id")
      .eq("user_id", userId);
    if (!memberError) {
      const ids = (memberRows ?? []).map((r) => r.album_id as string);
      if (ids.length > 0) {
        const { data, error } = await client
          .from("shared_albums")
          .select("*")
          .in("id", ids)
          .order("updated_at", { ascending: false });
        if (!error) {
          rows = data as AlbumRow[];
        } else if (!isMissingTable(error.message)) {
          console.error("listSharedAlbumsForUser albums:", error.message);
        }
      } else {
        rows = [];
      }
    } else if (!isMissingTable(memberError.message)) {
      console.error("listSharedAlbumsForUser members:", memberError.message);
    }
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const row of memory) {
    if (!byId.has(row.id)) {
      rows.push(row);
      byId.set(row.id, row);
    }
  }

  const summaries: SharedAlbumSummary[] = [];
  for (const album of rows) {
    const memberRows = await readMembers(album.id);
    if (peerId && !memberRows.some((m) => m.user_id === peerId)) continue;
    const itemRows = await readItems(album.id);
    const profiles = await loadProfiles(memberRows.map((m) => m.user_id));
    summaries.push(
      await toSummary(album, memberRows, itemRows.length, userId, profiles),
    );
  }
  return summaries;
}

export async function getSharedAlbumDetail(
  albumId: string,
  viewerId: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const album = await readAlbum(albumId);
  if (!album) return { error: "アルバムが見つかりません", status: 404 };

  const memberRows = await readMembers(album.id);
  const viewer = memberRows.find((m) => m.user_id === viewerId);
  if (!viewer) return { error: "このアルバムを見る権限がありません", status: 403 };

  const itemRows = await readItems(album.id);
  const profiles = await loadProfiles([
    ...memberRows.map((m) => m.user_id),
    ...itemRows.map((i) => i.added_by),
  ]);
  const posts = await loadPosts(itemRows.map((i) => i.post_id));
  const items: SharedAlbumItemView[] = itemRows
    .map((row) => {
      const post = posts.get(row.post_id);
      if (!post) return null;
      const addedBy =
        memberRows.find((m) => m.user_id === row.added_by) ??
        ({
          id: row.id,
          album_id: album.id,
          user_id: row.added_by,
          role: "member" as const,
          created_at: row.created_at,
        } satisfies MemberRow);
      return {
        id: row.id,
        post,
        addedBy: toMember(addedBy, profiles.get(row.added_by)),
      };
    })
    .filter((row): row is SharedAlbumItemView => Boolean(row));

  const summary = await toSummary(
    album,
    memberRows,
    items.length,
    viewerId,
    profiles,
  );
  return { ...summary, inviteToken: album.invite_token, items };
}

export async function createSharedAlbum(
  ownerId: string,
  rawTitle: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const title = trimTitle(rawTitle);
  if (!title) {
    return { error: "アルバム名を40文字以内で入力してください", status: 400 };
  }

  const owned = countMemorySharedAlbumsOwned(ownerId);
  const client = await writer();
  let ownedCount = owned;
  if (client && isUuid(ownerId)) {
    const { count, error } = await client
      .from("shared_albums")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId);
    if (!error && typeof count === "number") ownedCount = count;
  }
  if (ownedCount >= MAX_SHARED_ALBUMS_OWNED) {
    return { error: "アルバムの上限に達しています", status: 400 };
  }

  const token = generateInviteToken();
  let album: AlbumRow | null = null;

  if (client && isUuid(ownerId)) {
    const { data, error } = await client
      .from("shared_albums")
      .insert({
        owner_id: ownerId,
        title,
        invite_token: token,
      })
      .select("*")
      .single();
    if (error) {
      if (!isMissingTable(error.message)) {
        console.error("createSharedAlbum:", error.message);
        return { error: "アルバムを作れませんでした", status: 500 };
      }
    } else {
      album = data as AlbumRow;
      const { error: memberError } = await client.from("shared_album_members").insert({
        album_id: album.id,
        user_id: ownerId,
        role: "owner",
      });
      if (memberError) {
        console.error("createSharedAlbum member:", memberError.message);
      }
    }
  }

  if (!album) {
    album = addMemorySharedAlbum({ ownerId, title, inviteToken: token });
  }

  const detail = await getSharedAlbumDetail(album.id, ownerId);
  if ("error" in detail) return detail;
  return detail;
}

export async function inviteToSharedAlbum(
  albumId: string,
  ownerId: string,
  inviteeId: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const album = await readAlbum(albumId);
  if (!album) return { error: "アルバムが見つかりません", status: 404 };
  if (album.owner_id !== ownerId) {
    return { error: "招待できるのは作成した人だけです", status: 403 };
  }
  if (inviteeId === ownerId) {
    return { error: "自分はすでに参加しています", status: 400 };
  }

  const following =
    (await isAcceptedFollower(ownerId, inviteeId)) ||
    (await isAcceptedFollower(inviteeId, ownerId));
  if (!following && isUuid(inviteeId)) {
    return { error: "フォローしている人だけを誘えます", status: 403 };
  }

  const memberRows = await readMembers(album.id);
  if (memberRows.some((m) => m.user_id === inviteeId)) {
    return getSharedAlbumDetail(album.id, ownerId);
  }
  if (memberRows.length >= MAX_SHARED_ALBUM_MEMBERS) {
    return { error: "参加できる人数の上限です", status: 400 };
  }

  const client = await writer();
  if (client && isUuid(album.id) && isUuid(inviteeId)) {
    const { error } = await client.from("shared_album_members").insert({
      album_id: album.id,
      user_id: inviteeId,
      role: "member",
    });
    if (error && !isMissingTable(error.message)) {
      console.error("inviteToSharedAlbum:", error.message);
      return { error: "招待できませんでした", status: 500 };
    }
  }
  addMemorySharedAlbumMember({
    albumId: album.id,
    userId: inviteeId,
    role: "member",
  });

  if (client && isUuid(inviteeId)) {
    const profiles = await loadProfiles([ownerId]);
    const inviter = profiles.get(ownerId)?.displayName ?? "友だち";
    await createNotification(client, inviteeId, "system_message", `${inviter}がアルバムに誘いました`, {
      body: album.title,
      link: `/profile/posts?tab=album&album=${album.id}`,
    });
  }

  return getSharedAlbumDetail(album.id, ownerId);
}

export async function joinSharedAlbumByToken(
  userId: string,
  token: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const trimmed = token.trim();
  if (!trimmed) return { error: "リンクが正しくありません", status: 400 };

  let album: AlbumRow | null = getMemorySharedAlbumByToken(trimmed);
  const client = await writer();
  if (client) {
    const { data, error } = await client
      .from("shared_albums")
      .select("*")
      .eq("invite_token", trimmed)
      .maybeSingle();
    if (!error && data) album = data as AlbumRow;
    else if (error && !isMissingTable(error.message)) {
      console.error("joinSharedAlbumByToken:", error.message);
    }
  }
  if (!album) return { error: "アルバムが見つかりません", status: 404 };

  const memberRows = await readMembers(album.id);
  if (!memberRows.some((m) => m.user_id === userId)) {
    if (memberRows.length >= MAX_SHARED_ALBUM_MEMBERS) {
      return { error: "参加できる人数の上限です", status: 400 };
    }
    if (client && isUuid(album.id) && isUuid(userId)) {
      const { error } = await client.from("shared_album_members").insert({
        album_id: album.id,
        user_id: userId,
        role: "member",
      });
      if (error && !isMissingTable(error.message)) {
        console.error("joinSharedAlbumByToken insert:", error.message);
        return { error: "参加できませんでした", status: 500 };
      }
    }
    addMemorySharedAlbumMember({
      albumId: album.id,
      userId,
      role: album.owner_id === userId ? "owner" : "member",
    });
  }

  return getSharedAlbumDetail(album.id, userId);
}

export async function addPostToSharedAlbum(
  albumId: string,
  userId: string,
  postId: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const album = await readAlbum(albumId);
  if (!album) return { error: "アルバムが見つかりません", status: 404 };
  const member = getMemorySharedAlbumMember(album.id, userId);
  const memberRows = await readMembers(album.id);
  const isMember = Boolean(member || memberRows.some((m) => m.user_id === userId));
  if (!isMember) return { error: "参加していないアルバムです", status: 403 };

  const itemRows = await readItems(album.id);
  if (itemRows.length >= MAX_SHARED_ALBUM_ITEMS) {
    return { error: "写真の上限です", status: 400 };
  }
  if (itemRows.some((i) => i.post_id === postId)) {
    return getSharedAlbumDetail(album.id, userId);
  }

  const demo = MY_POSTS_DEMO.find((p) => p.id === postId);
  if (!demo) {
    const access = await getCommunityPostAccess(postId, userId);
    if (access.kind !== "ok") {
      return { error: "その投稿は入れられません", status: 400 };
    }
    if (access.post.author_id !== userId) {
      return { error: "自分の投稿だけを入れられます", status: 403 };
    }
    if (access.post.status === "draft") {
      return { error: "下書きは入れられません", status: 400 };
    }
  }

  const client = await writer();
  if (client && isUuid(album.id) && isUuid(postId) && isUuid(userId)) {
    const { error } = await client.from("shared_album_items").insert({
      album_id: album.id,
      post_id: postId,
      added_by: userId,
    });
    if (error && !isMissingTable(error.message)) {
      console.error("addPostToSharedAlbum:", error.message);
      return { error: "写真を入れられませんでした", status: 500 };
    }
  }
  const added = addMemorySharedAlbumItem({
    albumId: album.id,
    postId,
    addedBy: userId,
  });
  if ("error" in added) {
    return getSharedAlbumDetail(album.id, userId);
  }
  await refreshCover(album.id);
  return getSharedAlbumDetail(album.id, userId);
}

export async function removeSharedAlbumItem(
  albumId: string,
  userId: string,
  itemId: string,
): Promise<SharedAlbumDetail | { error: string; status: number }> {
  const album = await readAlbum(albumId);
  if (!album) return { error: "アルバムが見つかりません", status: 404 };
  const memberRows = await readMembers(album.id);
  if (!memberRows.some((m) => m.user_id === userId)) {
    return { error: "参加していないアルバムです", status: 403 };
  }

  const item =
    getMemorySharedAlbumItem(itemId) ??
    (await readItems(album.id)).find((i) => i.id === itemId) ??
    null;
  if (!item || item.album_id !== album.id) {
    return { error: "写真が見つかりません", status: 404 };
  }
  if (item.added_by !== userId && album.owner_id !== userId) {
    return { error: "この写真は外せません", status: 403 };
  }

  const client = await writer();
  if (client && isUuid(item.id)) {
    await client.from("shared_album_items").delete().eq("id", item.id);
  }
  deleteMemorySharedAlbumItem(item.id);
  await refreshCover(album.id);
  return getSharedAlbumDetail(album.id, userId);
}

export async function deleteSharedAlbum(
  albumId: string,
  userId: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const album = await readAlbum(albumId);
  if (!album) return { error: "アルバムが見つかりません", status: 404 };
  if (album.owner_id !== userId) {
    return { error: "削除できるのは作成した人だけです", status: 403 };
  }
  const client = await writer();
  if (client && isUuid(album.id)) {
    const { error } = await client.from("shared_albums").delete().eq("id", album.id);
    if (error && !isMissingTable(error.message)) {
      console.error("deleteSharedAlbum:", error.message);
      return { error: "削除できませんでした", status: 500 };
    }
  }
  deleteMemorySharedAlbum(album.id);
  return { ok: true };
}

export async function listInviteCandidates(
  userId: string,
): Promise<SharedAlbumInvitee[]> {
  const [following, followers] = await Promise.all([
    listAcceptedFollowing(userId),
    listAcceptedFollowers(userId),
  ]);
  const ids = [
    ...following.map((r) => r.followee_id),
    ...followers.map((r) => r.follower_id),
  ].filter((id) => id !== userId);
  const profiles = await loadProfiles(ids);
  const seen = new Set<string>();
  const list: SharedAlbumInvitee[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const profile = profiles.get(id);
    list.push({
      id,
      displayName: profile?.displayName ?? "ユーザー",
      avatarUrl: profile?.avatarUrl ?? null,
    });
  }
  return list;
}
