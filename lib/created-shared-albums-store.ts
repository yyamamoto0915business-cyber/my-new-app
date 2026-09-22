export type MemorySharedAlbum = {
  id: string;
  owner_id: string;
  title: string;
  cover_url: string | null;
  invite_token: string;
  created_at: string;
  updated_at: string;
};

export type MemorySharedAlbumMember = {
  id: string;
  album_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
};

export type MemorySharedAlbumItem = {
  id: string;
  album_id: string;
  post_id: string;
  added_by: string;
  created_at: string;
};

const albums: MemorySharedAlbum[] = [];
const members: MemorySharedAlbumMember[] = [];
const items: MemorySharedAlbumItem[] = [];

function nowIso() {
  return new Date().toISOString();
}

function nid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

export function addMemorySharedAlbum(input: {
  ownerId: string;
  title: string;
  inviteToken: string;
}): MemorySharedAlbum {
  const row: MemorySharedAlbum = {
    id: nid("mem-album"),
    owner_id: input.ownerId,
    title: input.title,
    cover_url: null,
    invite_token: input.inviteToken,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  albums.unshift(row);
  members.push({
    id: nid("mem-am"),
    album_id: row.id,
    user_id: input.ownerId,
    role: "owner",
    created_at: row.created_at,
  });
  return row;
}

export function getMemorySharedAlbum(id: string): MemorySharedAlbum | null {
  return albums.find((a) => a.id === id) ?? null;
}

export function getMemorySharedAlbumByToken(
  token: string,
): MemorySharedAlbum | null {
  return albums.find((a) => a.invite_token === token) ?? null;
}

export function updateMemorySharedAlbum(
  id: string,
  patch: Partial<Pick<MemorySharedAlbum, "title" | "cover_url">>,
): MemorySharedAlbum | null {
  const row = getMemorySharedAlbum(id);
  if (!row) return null;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.cover_url !== undefined) row.cover_url = patch.cover_url;
  row.updated_at = nowIso();
  return row;
}

export function deleteMemorySharedAlbum(id: string): boolean {
  const idx = albums.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  albums.splice(idx, 1);
  for (let i = members.length - 1; i >= 0; i -= 1) {
    if (members[i].album_id === id) members.splice(i, 1);
  }
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].album_id === id) items.splice(i, 1);
  }
  return true;
}

export function listMemorySharedAlbumsForUser(userId: string): MemorySharedAlbum[] {
  const ids = new Set(
    members.filter((m) => m.user_id === userId).map((m) => m.album_id),
  );
  return albums
    .filter((a) => ids.has(a.id))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

export function listMemorySharedAlbumMembers(
  albumId: string,
): MemorySharedAlbumMember[] {
  return members.filter((m) => m.album_id === albumId);
}

export function getMemorySharedAlbumMember(
  albumId: string,
  userId: string,
): MemorySharedAlbumMember | null {
  return (
    members.find((m) => m.album_id === albumId && m.user_id === userId) ?? null
  );
}

export function addMemorySharedAlbumMember(input: {
  albumId: string;
  userId: string;
  role: "owner" | "member";
}): MemorySharedAlbumMember {
  const existing = getMemorySharedAlbumMember(input.albumId, input.userId);
  if (existing) return existing;
  const row: MemorySharedAlbumMember = {
    id: nid("mem-am"),
    album_id: input.albumId,
    user_id: input.userId,
    role: input.role,
    created_at: nowIso(),
  };
  members.push(row);
  const album = getMemorySharedAlbum(input.albumId);
  if (album) album.updated_at = nowIso();
  return row;
}

export function listMemorySharedAlbumItems(
  albumId: string,
): MemorySharedAlbumItem[] {
  return items
    .filter((i) => i.album_id === albumId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function addMemorySharedAlbumItem(input: {
  albumId: string;
  postId: string;
  addedBy: string;
}): MemorySharedAlbumItem | { error: "duplicate" } {
  if (
    items.some((i) => i.album_id === input.albumId && i.post_id === input.postId)
  ) {
    return { error: "duplicate" };
  }
  const row: MemorySharedAlbumItem = {
    id: nid("mem-ai"),
    album_id: input.albumId,
    post_id: input.postId,
    added_by: input.addedBy,
    created_at: nowIso(),
  };
  items.unshift(row);
  const album = getMemorySharedAlbum(input.albumId);
  if (album) album.updated_at = nowIso();
  return row;
}

export function getMemorySharedAlbumItem(
  itemId: string,
): MemorySharedAlbumItem | null {
  return items.find((i) => i.id === itemId) ?? null;
}

export function deleteMemorySharedAlbumItem(itemId: string): boolean {
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;
  items.splice(idx, 1);
  return true;
}

export function countMemorySharedAlbumsOwned(ownerId: string): number {
  return albums.filter((a) => a.owner_id === ownerId).length;
}
