"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Link2, Plus, UserPlus, X } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { MyAlbumMediaGrid } from "./MyAlbumMediaGrid";
import type { AlbumProfile } from "./MyAlbumProfileHeader";
import {
  cloneDemoAlbums,
  DEMO_ALBUM_INVITEES,
} from "@/lib/posts/shared-albums-demo";
import type {
  SharedAlbumDetail,
  SharedAlbumInvitee,
  SharedAlbumMember,
  SharedAlbumSummary,
} from "@/lib/posts/shared-album-types";
import { cn } from "@/lib/utils";

function memberLabel(members: SharedAlbumMember[]) {
  return members.map((m) => m.displayName).join(" · ");
}

function AvatarStack({ members }: { members: SharedAlbumMember[] }) {
  return (
    <span className="mg-share-avatars" aria-hidden>
      {members.slice(0, 3).map((m) => (
        <span key={m.userId} className="mg-share-avatars__item">
          <ProfileBannerAvatar avatarUrl={m.avatarUrl} displayName={m.displayName} />
        </span>
      ))}
    </span>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mg-share-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="mg-share-sheet__scrim" onClick={onClose} aria-label="閉じる" />
      <div className="mg-share-sheet__panel">
        <div className="mg-share-sheet__head">
          <p>{title}</p>
          <button type="button" onClick={onClose} aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function MySharedAlbumsPane({
  isOwn,
  demoMode,
  posts,
  profile,
  peerId,
  initialAlbumId,
  joinToken,
  onDetailOpenChange,
}: {
  isOwn: boolean;
  demoMode: boolean;
  posts: MyPostItem[];
  profile: AlbumProfile | null;
  peerId?: string;
  initialAlbumId?: string | null;
  joinToken?: string | null;
  onDetailOpenChange?: (open: boolean) => void;
}) {
  const [albums, setAlbums] = useState<SharedAlbumSummary[]>([]);
  const [detail, setDetail] = useState<SharedAlbumDetail | null>(null);
  const [demoDetails, setDemoDetails] = useState<SharedAlbumDetail[]>(() =>
    demoMode ? cloneDemoAlbums() : [],
  );
  const [loading, setLoading] = useState(!demoMode);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "invite" | "add">(null);
  const [invitees, setInvitees] = useState<SharedAlbumInvitee[]>([]);
  const [copied, setCopied] = useState(false);
  const joinedRef = useRef(false);
  const openedInitialRef = useRef<string | null>(null);

  const selfMember: SharedAlbumMember = useMemo(
    () => ({
      userId: "self",
      displayName: profile?.displayName ?? "あなた",
      avatarUrl: profile?.avatarUrl ?? null,
      role: "owner",
    }),
    [profile],
  );

  const applyDetail = useCallback(
    (next: SharedAlbumDetail | null) => {
      setDetail(next);
      onDetailOpenChange?.(Boolean(next));
    },
    [onDetailOpenChange],
  );

  const visibleAlbums = useMemo<SharedAlbumSummary[]>(
    () =>
      demoMode
        ? demoDetails.map(({ inviteToken: _t, items: _i, ...rest }) => rest)
        : albums,
    [albums, demoDetails, demoMode],
  );

  const loadList = useCallback(async () => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const qs = peerId ? `?peerId=${encodeURIComponent(peerId)}` : "";
    const res = await fetch(`/api/me/albums${qs}`);
    if (!res.ok) {
      setAlbums([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { albums: SharedAlbumSummary[] };
    setAlbums(data.albums ?? []);
    setLoading(false);
  }, [demoMode, peerId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openAlbum = useCallback(
    async (id: string) => {
      if (demoMode) {
        const found = demoDetails.find((a) => a.id === id) ?? null;
        applyDetail(found);
        return;
      }
      const res = await fetch(`/api/me/albums/${id}`);
      if (!res.ok) {
        setMessage("アルバムを開けませんでした");
        return;
      }
      const data = (await res.json()) as { album: SharedAlbumDetail };
      applyDetail(data.album);
    },
    [applyDetail, demoDetails, demoMode],
  );

  useEffect(() => {
    if (!joinToken || demoMode || joinedRef.current) return;
    joinedRef.current = true;
    let cancelled = false;
    void fetch("/api/me/albums/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: joinToken }),
    }).then(async (res) => {
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as { album: SharedAlbumDetail };
      applyDetail(data.album);
      void loadList();
    });
    return () => {
      cancelled = true;
    };
  }, [applyDetail, demoMode, joinToken, loadList]);

  useEffect(() => {
    if (!initialAlbumId || openedInitialRef.current === initialAlbumId) return;
    openedInitialRef.current = initialAlbumId;
    void openAlbum(initialAlbumId);
  }, [initialAlbumId, openAlbum]);

  const createAlbum = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setMessage("アルバムの名前を入れてください");
      return;
    }
    setBusy(true);
    setMessage(null);
    if (demoMode) {
      const created: SharedAlbumDetail = {
        id: `demo-album-${Date.now()}`,
        title: nextTitle,
        coverUrl: null,
        photoCount: 0,
        members: [selfMember],
        isOwner: true,
        inviteToken: `demo-${Date.now()}`,
        items: [],
      };
      setDemoDetails((prev) => [created, ...prev]);
      setTitle("");
      setCreating(false);
      setBusy(false);
      applyDetail(created);
      return;
    }
    const res = await fetch("/api/me/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    });
    const data = (await res.json()) as { album?: SharedAlbumDetail; error?: string };
    setBusy(false);
    if (!res.ok || !data.album) {
      setMessage(data.error ?? "作れませんでした");
      return;
    }
    setTitle("");
    setCreating(false);
    await loadList();
    applyDetail(data.album);
  };

  const loadInvitees = async () => {
    if (demoMode) {
      setInvitees(DEMO_ALBUM_INVITEES);
      return;
    }
    const res = await fetch("/api/me/albums?invitees=1");
    if (!res.ok) return;
    const data = (await res.json()) as { invitees: SharedAlbumInvitee[] };
    setInvitees(data.invitees ?? []);
  };

  const invite = async (userId: string) => {
    if (!detail) return;
    setBusy(true);
    if (demoMode) {
      const person = DEMO_ALBUM_INVITEES.find((p) => p.id === userId);
      if (person && !detail.members.some((m) => m.userId === userId)) {
        const next: SharedAlbumDetail = {
          ...detail,
          members: [
            ...detail.members,
            {
              userId: person.id,
              displayName: person.displayName,
              avatarUrl: person.avatarUrl,
              role: "member",
            },
          ],
        };
        setDemoDetails((prev) => prev.map((a) => (a.id === next.id ? next : a)));
        applyDetail(next);
      }
      setBusy(false);
      setSheet(null);
      return;
    }
    const res = await fetch(`/api/me/albums/${detail.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = (await res.json()) as { album?: SharedAlbumDetail; error?: string };
    setBusy(false);
    if (!res.ok || !data.album) {
      setMessage(data.error ?? "誘えませんでした");
      return;
    }
    applyDetail(data.album);
    setSheet(null);
    void loadList();
  };

  const addPost = async (postId: string) => {
    if (!detail) return;
    setBusy(true);
    if (demoMode) {
      const post = posts.find((p) => p.id === postId);
      if (post && !detail.items.some((i) => i.post.id === postId)) {
        const next: SharedAlbumDetail = {
          ...detail,
          coverUrl: detail.coverUrl ?? post.imageUrl,
          photoCount: detail.items.length + 1,
          items: [
            {
              id: `${detail.id}-${post.id}`,
              post,
              addedBy: selfMember,
            },
            ...detail.items,
          ],
        };
        setDemoDetails((prev) => prev.map((a) => (a.id === next.id ? next : a)));
        applyDetail(next);
      }
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/me/albums/${detail.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = (await res.json()) as { album?: SharedAlbumDetail; error?: string };
    setBusy(false);
    if (!res.ok || !data.album) {
      setMessage(data.error ?? "入れられませんでした");
      return;
    }
    applyDetail(data.album);
    void loadList();
  };

  const copyLink = async () => {
    if (!detail) return;
    const url = `${window.location.origin}/profile/posts?tab=album&join=${encodeURIComponent(detail.inviteToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage("リンクをコピーできませんでした");
    }
  };

  const addablePosts = posts.filter(
    (p) =>
      p.status !== "draft" &&
      !detail?.items.some((item) => item.post.id === p.id),
  );

  if (detail) {
    return (
      <section className="mg-share-detail">
        <button
          type="button"
          className="mg-share-back"
          onClick={() => {
            applyDetail(null);
            void loadList();
          }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          アルバム一覧
        </button>

        <div className="mg-share-hero">
          {detail.coverUrl ? (
            <Image
              src={detail.coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 720px) 100vw, 720px"
            />
          ) : (
            <span className="mg-share-hero__empty" />
          )}
          <span className="mg-share-hero__wash" aria-hidden />
        </div>

        <div className="mg-share-detail__body">
          <h2 className="mg-share-detail__title">{detail.title}</h2>
          <p className="mg-share-detail__people">
            <AvatarStack members={detail.members} />
            {memberLabel(detail.members)}
            <span> {detail.photoCount}枚</span>
          </p>

          <div className="mg-share-detail__actions">
            <button
              type="button"
              className="mg-share-btn"
              onClick={() => {
                setSheet("invite");
                void loadInvitees();
              }}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              誘う
            </button>
            <button
              type="button"
              className="mg-share-btn mg-share-btn--solid"
              onClick={() => setSheet("add")}
            >
              <Plus className="h-4 w-4" aria-hidden />
              写真を入れる
            </button>
          </div>

          {message ? <p className="mg-share-msg">{message}</p> : null}

          {detail.items.length === 0 ? (
            <div className="mg-album-empty">
              <p>まだ写真がありません</p>
              <button
                type="button"
                className="mg-album-empty__cta"
                onClick={() => setSheet("add")}
              >
                写真を入れる
              </button>
            </div>
          ) : (
            <MyAlbumMediaGrid
              posts={detail.items.map((item) => item.post)}
              showMenu={false}
              addedBy={Object.fromEntries(
                detail.items.map((item) => [item.post.id, item.addedBy]),
              )}
            />
          )}
        </div>

        {sheet === "invite" ? (
          <Sheet title="一緒に作る人を誘う" onClose={() => setSheet(null)}>
            <button type="button" className="mg-share-link" onClick={() => void copyLink()}>
              <Link2 className="h-4 w-4" aria-hidden />
              {copied ? "リンクをコピーしました" : "リンクをコピー"}
            </button>
            <ul className="mg-share-people">
              {invitees.length === 0 ? (
                <li className="mg-share-people__empty">誘える友だちは、まだいません</li>
              ) : (
                invitees.map((person) => {
                  const inAlbum = detail.members.some((m) => m.userId === person.id);
                  return (
                    <li key={person.id}>
                      <span className="mg-share-people__who">
                        <span className="mg-share-people__av">
                          <ProfileBannerAvatar
                            avatarUrl={person.avatarUrl}
                            displayName={person.displayName}
                          />
                        </span>
                        {person.displayName}
                      </span>
                      <button
                        type="button"
                        className="mg-share-btn mg-share-btn--tiny"
                        disabled={inAlbum || busy}
                        onClick={() => void invite(person.id)}
                      >
                        {inAlbum ? "参加中" : "誘う"}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </Sheet>
        ) : null}

        {sheet === "add" ? (
          <Sheet title="写真を入れる" onClose={() => setSheet(null)}>
            {addablePosts.length === 0 ? (
              <p className="mg-share-people__empty">入れられる写真は、いまありません</p>
            ) : (
              <ul className="mg-share-pick">
                {addablePosts.map((post) => (
                  <li key={post.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void addPost(post.id)}
                    >
                      <span className="mg-share-pick__photo">
                        {post.imageUrl ? (
                          <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="72px" />
                        ) : null}
                      </span>
                      <span>
                        <strong>{post.title}</strong>
                        <small>{post.dateLabel}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Sheet>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mg-share-list">
      {isOwn ? (
        creating ? (
          <form
            className="mg-share-create"
            onSubmit={(e) => {
              e.preventDefault();
              void createAlbum();
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              placeholder="アルバムの名前"
              aria-label="アルバムの名前"
              autoFocus
            />
            <div className="mg-share-create__row">
              <button type="button" className="mg-share-btn" onClick={() => setCreating(false)}>
                やめる
              </button>
              <button type="submit" className="mg-share-btn mg-share-btn--solid" disabled={busy}>
                つくる
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="mg-share-create-btn" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            一緒に作る
          </button>
        )
      ) : null}

      {message ? <p className="mg-share-msg">{message}</p> : null}

      {loading ? (
        <div className="mg-share-cards">
          {[0, 1].map((i) => (
            <div key={i} className="mg-share-card is-skeleton" />
          ))}
        </div>
      ) : visibleAlbums.length === 0 ? (
        <div className="mg-album-empty">
          <p>
            {isOwn
              ? "まだ一緒に作るアルバムはありません"
              : "一緒に作ったアルバムは、まだありません"}
          </p>
        </div>
      ) : (
        <ul className="mg-share-cards">
          {visibleAlbums.map((album) => (
            <li key={album.id}>
              <button
                type="button"
                className="mg-share-card"
                onClick={() => void openAlbum(album.id)}
              >
                <span className="mg-share-card__cover">
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 720px) 100vw, 640px"
                    />
                  ) : (
                    <span className="mg-share-card__blank">これから、ふたりの記録</span>
                  )}
                </span>
                <span className="mg-share-card__body">
                  <strong>{album.title}</strong>
                  <span>
                    <AvatarStack members={album.members} />
                    {memberLabel(album.members)}　{album.photoCount}枚
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
