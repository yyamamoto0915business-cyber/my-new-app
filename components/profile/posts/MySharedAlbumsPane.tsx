"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  ImageIcon,
  Images,
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { MyAlbumMapPane } from "./MyAlbumMapPane";
import type { AlbumProfile } from "./MyAlbumProfileHeader";
import {
  SharedAlbumShotGrid,
  SharedAlbumTimeline,
} from "./SharedAlbumShotGrid";
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
  return members.map((m) => m.displayName).join("・");
}

function AvatarStack({
  members,
  limit = 4,
  size = "sm",
}: {
  members: SharedAlbumMember[];
  limit?: number;
  size?: "sm" | "lg";
}) {
  const shown = members.slice(0, limit);
  const extra = members.length - shown.length;
  return (
    <span className={cn("mg-share-avatars", size === "lg" && "mg-share-avatars--lg")} aria-hidden>
      {shown.map((m) => (
        <span key={m.userId} className="mg-share-avatars__item">
          <ProfileBannerAvatar avatarUrl={m.avatarUrl} displayName={m.displayName} />
        </span>
      ))}
      {extra > 0 ? <span className="mg-share-avatars__more">+{extra}</span> : null}
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
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const viewport = window.visualViewport;
    const panel = panelRef.current;
    if (!viewport || !panel) return;
    const fit = () => {
      const top = viewport.offsetTop;
      panel.style.maxHeight = `${Math.max(240, viewport.height - top - 12)}px`;
    };
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="mg-share-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="mg-share-sheet__scrim" onClick={onClose} aria-label="閉じる" />
      <div ref={panelRef} className="mg-share-sheet__panel">
        <div className="mg-share-sheet__head">
          <p>{title}</p>
          <button type="button" onClick={onClose} aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mg-share-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
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
  const [sheet, setSheet] = useState<null | "invite" | "add" | "edit">(null);
  const [invitees, setInvitees] = useState<SharedAlbumInvitee[]>([]);
  const [copied, setCopied] = useState(false);
  const [detailTab, setDetailTab] = useState<"photos" | "map" | "timeline">("photos");
  const [editTitle, setEditTitle] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [editLead, setEditLead] = useState("");
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
      setDetailTab("photos");
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

  const openEdit = () => {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditBlurb(detail.blurb ?? "");
    setEditLead(detail.lead ?? "みんなで集めた思い出アルバム");
    setCopied(false);
    setMessage(null);
    setSheet("edit");
  };

  const saveEdit = async () => {
    if (!detail) return;
    const nextTitle = editTitle.trim().replace(/\s+/g, " ");
    if (!nextTitle || nextTitle.length > 40) {
      setMessage("アルバム名を40文字以内で入力してください");
      return;
    }
    const nextBlurb = editBlurb.trim().replace(/\s+/g, " ");
    const nextLead = editLead.trim().replace(/\s+/g, " ");
    if (nextBlurb.length > 80) {
      setMessage("説明は80文字以内で入力してください");
      return;
    }
    if (nextLead.length > 40) {
      setMessage("ひとことは40文字以内で入力してください");
      return;
    }
    const next: SharedAlbumDetail = {
      ...detail,
      title: nextTitle,
      blurb: nextBlurb || null,
      lead: nextLead || null,
    };
    setBusy(true);
    if (demoMode) {
      setDemoDetails((prev) => prev.map((a) => (a.id === next.id ? next : a)));
      setDetail(next);
      setBusy(false);
      setSheet(null);
      setMessage(null);
      return;
    }
    const res = await fetch(`/api/me/albums/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: nextTitle,
        blurb: nextBlurb,
        lead: nextLead,
      }),
    });
    const data = (await res.json()) as { album?: SharedAlbumDetail; error?: string };
    setBusy(false);
    if (!res.ok || !data.album) {
      setMessage(data.error ?? "保存できませんでした");
      return;
    }
    setDetail(data.album);
    setSheet(null);
    setMessage(null);
    void loadList();
  };

  const addablePosts = posts.filter(
    (p) =>
      p.status !== "draft" &&
      !detail?.items.some((item) => item.post.id === p.id),
  );

  if (detail) {
    return (
      <section className="mg-share-detail">
        <div className="mg-share-detail__top">
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
          <div className="mg-share-detail__top-actions">
            <span className="mg-share-chip">
              <Users className="h-3.5 w-3.5" aria-hidden />
              メンバー {detail.members.length}
            </span>
            <button
              type="button"
              className="mg-share-chip"
              onClick={() => {
                setSheet("invite");
                void loadInvitees();
              }}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              招待する
            </button>
            <button
              type="button"
              className="mg-share-chip mg-share-chip--icon"
              onClick={openEdit}
              aria-label="アルバムを編集"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mg-share-detail__head">
          <h2 className="mg-share-detail__title">
            {detail.title}
            <Image
              src="/profile/album/title-sprig.png"
              alt=""
              width={18}
              height={30}
              className="mg-share-detail__sprig"
            />
          </h2>
          <p className="mg-share-detail__blurb">
            {detail.blurb ?? "みんなで残す、まちのアルバム。"}
            {detail.lead ? (
              <>
                <br />
                {detail.lead}
              </>
            ) : null}
          </p>
          <div className="mg-share-detail__row">
            <AvatarStack members={detail.members} limit={4} size="lg" />
            <span className="mg-share-bubble" aria-hidden>
              <svg className="mg-share-bubble__doodle" viewBox="0 0 42 30" aria-hidden>
                <path d="M6 22c6-9 14-14 28-16" fill="none" stroke="#3d8a5c" strokeWidth="1.35" strokeLinecap="round" />
                <path d="M24 7c3-4 7-5 12-3" fill="none" stroke="#3d8a5c" strokeWidth="1.15" strokeLinecap="round" />
                <path d="M30 12c2-2 4-2 7-1" fill="none" stroke="#3d8a5c" strokeWidth="1.05" strokeLinecap="round" />
              </svg>
              みんなで
              <br />
              作っています！
            </span>
            <button
              type="button"
              className="mg-share-btn mg-share-btn--solid mg-share-btn--add"
              onClick={() => setSheet("add")}
            >
              <svg className="mg-share-spark" viewBox="0 0 24 24" aria-hidden>
                <path fill="#f0c24b" d="M12 1.2 13.7 8.4 21 10.2 13.7 12 12 19.2 10.3 12 3 10.2 10.3 8.4Z" />
                <path fill="#f7d56a" d="M19.2 2.2 20 5.1 23 6 20 6.9 19.2 9.8 18.4 6.9 15.4 6 18.4 5.1Z" />
              </svg>
              <Camera className="h-4 w-4" aria-hidden />
              写真を追加する
            </button>
          </div>
        </div>

        <nav className="mg-share-detail__tabs" aria-label="アルバムの見方">
          {(
            [
              ["photos", "写真", Images],
              ["map", "地図", MapPin],
              ["timeline", "タイムライン", MessageCircle],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={cn("mg-share-detail__tab", detailTab === id && "is-active")}
              aria-current={detailTab === id ? "page" : undefined}
              onClick={() => setDetailTab(id)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        {message ? <p className="mg-share-msg">{message}</p> : null}

        {detail.items.length === 0 && detailTab === "photos" ? (
          <div className="mg-album-empty">
            <p>まだ写真がありません</p>
            <button
              type="button"
              className="mg-album-empty__cta"
              onClick={() => setSheet("add")}
            >
              写真を追加する
            </button>
          </div>
        ) : detailTab === "map" ? (
          <MyAlbumMapPane posts={detail.items.map((item) => item.post)} />
        ) : detailTab === "timeline" ? (
          <SharedAlbumTimeline items={detail.items} />
        ) : (
          <SharedAlbumShotGrid items={detail.items} />
        )}

        <div className="mg-share-composer">
          <span className="mg-share-composer__av">
            <ProfileBannerAvatar
              avatarUrl={profile?.avatarUrl ?? null}
              displayName={profile?.displayName ?? "あなた"}
            />
          </span>
          <button
            type="button"
            className="mg-share-composer__field"
            onClick={() => setSheet("add")}
          >
            思い出をみんなで残そう...
          </button>
          <button type="button" onClick={() => setSheet("add")} aria-label="写真を入れる">
            <ImageIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setSheet("add")} aria-label="カメラ">
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setDetailTab("map")}
            aria-label="地図"
          >
            <MapPin className="h-5 w-5" />
          </button>
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

        {sheet === "edit" ? (
          <Sheet title="アルバムを編集" onClose={() => setSheet(null)}>
            <form
              className="mg-share-edit"
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit();
              }}
            >
              <button type="button" className="mg-share-link" onClick={() => void copyLink()}>
                <Link2 className="h-4 w-4" aria-hidden />
                {copied ? "リンクをコピーしました" : "リンクをコピー"}
              </button>
              <label>
                アルバムの名前
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={40}
                  placeholder="春の散歩"
                />
              </label>
              <label>
                説明
                <textarea
                  value={editBlurb}
                  onChange={(e) => setEditBlurb(e.target.value)}
                  maxLength={80}
                  rows={2}
                  placeholder="ぽかぽかの春に見つけたまちの風景たち。"
                />
              </label>
              <label>
                ひとこと
                <input
                  value={editLead}
                  onChange={(e) => setEditLead(e.target.value)}
                  maxLength={40}
                  placeholder="みんなで集めた思い出アルバム🌸"
                />
              </label>
              {message ? <p className="mg-share-msg">{message}</p> : null}
              <button
                type="submit"
                className="mg-share-btn mg-share-btn--solid"
                disabled={busy || !detail.isOwner}
              >
                保存する
              </button>
            </form>
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
            <span className="mg-share-create-btn__leaf" aria-hidden>
              <Image src="/profile/album/title-sprig.png" alt="" width={28} height={44} />
              <Image src="/profile/album/title-sprig.png" alt="" width={22} height={36} />
            </span>
            <Plus className="h-4 w-4" aria-hidden />
            <span>一緒に作る</span>
            <span className="mg-share-create-btn__thumbs" aria-hidden>
              {visibleAlbums.slice(0, 2).map((album) =>
                album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={album.id} src={album.coverUrl} alt="" />
                ) : (
                  <span key={album.id} />
                ),
              )}
            </span>
            <ChevronRight className="h-4 w-4 mg-share-create-btn__chev" aria-hidden />
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
                <span className="mg-share-polaroid">
                  <span className="mg-share-polaroid__frame">
                    {album.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={album.coverUrl} alt="" />
                    ) : (
                      <span className="mg-share-card__blank" />
                    )}
                    <em>{album.title}</em>
                  </span>
                </span>
                <span className="mg-share-card__body">
                  <strong>{album.title}</strong>
                  <span className="mg-share-card__meta">
                    {album.members.length > 1 ? (
                      <span className="mg-share-card__who">{memberLabel(album.members)}</span>
                    ) : null}
                    {album.members.length > 0 ? <AvatarStack members={album.members} /> : null}
                    {album.photoCount}枚
                  </span>
                  {album.blurb ? <small>{album.blurb}</small> : null}
                </span>
                <span className="mg-share-card__more" aria-hidden>
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
