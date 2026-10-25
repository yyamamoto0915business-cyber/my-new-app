"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Pencil, Plus, Share, User } from "lucide-react";
import { AccountVisibilityChip } from "@/components/profile/account-visibility-chip";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { ModerationMenu } from "@/components/moderation/ModerationMenu";
import { MyAlbumProfileShareSheet } from "./MyAlbumProfileShareSheet";
import { cn } from "@/lib/utils";

const COVER_BG = "/profile/album/desk-cover.jpg";
const TITLE_SPRIG = "/profile/album/title-sprig.png";
const POLAROID_FRONT = "/profile/album/spring/sakura.jpg";
const POLAROID_BACK = "/profile/album/spring/walk.jpg";

export type AlbumProfile = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  region: string | null;
  handle: string | null;
  isPro: boolean;
  counts: { posts: number; followers: number; following: number };
};

export function MyAlbumProfileHeader({
  profile,
  eyebrow,
  headline,
  lead,
  isOwn,
  authorId,
  shareUserId,
  onSelectPosts,
  onFollowChange,
  blockedByMe = false,
  onBlockChange,
}: {
  profile: AlbumProfile | null;
  eyebrow: string;
  headline: string;
  lead: string;
  isOwn: boolean;
  authorId?: string;
  shareUserId?: string;
  onSelectPosts?: () => void;
  onFollowChange?: (status: "none" | "pending" | "accepted" | "self" | "rejected") => void;
  /** 自分がこの人をブロックしているか */
  blockedByMe?: boolean;
  onBlockChange?: (blocked: boolean) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const name = profile?.displayName ?? (isOwn ? "あなた" : "ユーザー");
  const handle = profile?.handle?.replace(/^@/, "") || "machi_glyph";
  const sharePath = shareUserId ? `/users/${shareUserId}/album` : "/profile/posts";

  const avatarFace = profile?.avatarUrl ? (
    <ProfileBannerAvatar avatarUrl={profile.avatarUrl} displayName={name} />
  ) : (
    <span className="mg-album-avatar__empty" aria-hidden>
      <User strokeWidth={1.4} />
    </span>
  );

  const avatar = isOwn ? (
    <Link
      href="/profile/edit"
      className="mg-album-avatar"
      aria-label="プロフィール写真を編集"
    >
      {avatarFace}
      <span className="mg-album-avatar__plus" aria-hidden>
        <Plus className="h-3 w-3" strokeWidth={2.6} />
      </span>
    </Link>
  ) : (
    <div className="mg-album-avatar">{avatarFace}</div>
  );

  return (
    <header className="mg-album-profile">
      <div className="mg-album-cover">
        <Image
          src={COVER_BG}
          alt=""
          fill
          priority
          className="object-cover object-[82%_center]"
          sizes="(max-width: 899px) 100vw, 1180px"
        />
        <span className="mg-album-cover__wash" aria-hidden />

        <div className="mg-album-cover__polaroids" aria-hidden>
          <div className="mg-album-cover__polaroid is-back">
            <Image src={POLAROID_BACK} alt="" width={180} height={220} />
          </div>
          <div className="mg-album-cover__polaroid is-front">
            <Image src={POLAROID_FRONT} alt="" width={200} height={240} />
          </div>
          <div className="mg-album-cover__quote">
            <p>Good memories.</p>
            <p>
              Make a better
              <br />
              tomorrow.
            </p>
          </div>
        </div>

        {isOwn ? (
          <div className="mg-album-cover__tools">
            <AccountVisibilityChip className="shrink-0" />
            <Link
              href="/profile/edit"
              className="mg-album-cover__edit"
              aria-label="カバーを編集"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              <span className="mg-album-cover__edit-label">カバーを編集</span>
            </Link>
          </div>
        ) : null}

        <div className="mg-album-cover__copy">
          <p className="mg-album-cover__eyebrow">
            {eyebrow}
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={22}
              height={36}
              className="mg-album-cover__sprig"
              aria-hidden
            />
          </p>
          <h1 className="mg-album-cover__title">
            {headline}
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={22}
              height={36}
              className="mg-album-cover__sprig mg-album-cover__sprig--title"
              aria-hidden
            />
          </h1>
          <p className="mg-album-cover__lead">{lead}</p>
        </div>

        <div className="mg-album-identity">
          {avatar}
          <ul className="mg-album-stats">
            <li>
              <button type="button" className="mg-album-stats__item" onClick={onSelectPosts}>
                <span className="mg-album-stats__num">{profile?.counts.posts ?? 0}</span>
                <span className="mg-album-stats__label">投稿</span>
              </button>
            </li>
            <li>
              {isOwn ? (
                <Link href="/profile/follows?tab=followers" className="mg-album-stats__item">
                  <span className="mg-album-stats__num">{profile?.counts.followers ?? 0}</span>
                  <span className="mg-album-stats__label">フォロワー</span>
                </Link>
              ) : (
                <div className="mg-album-stats__item">
                  <span className="mg-album-stats__num">{profile?.counts.followers ?? 0}</span>
                  <span className="mg-album-stats__label">フォロワー</span>
                </div>
              )}
            </li>
            <li>
              {isOwn ? (
                <Link href="/profile/follows?tab=following" className="mg-album-stats__item">
                  <span className="mg-album-stats__num">{profile?.counts.following ?? 0}</span>
                  <span className="mg-album-stats__label">フォロー中</span>
                </Link>
              ) : (
                <div className="mg-album-stats__item">
                  <span className="mg-album-stats__num">{profile?.counts.following ?? 0}</span>
                  <span className="mg-album-stats__label">フォロー中</span>
                </div>
              )}
            </li>
          </ul>
          {!isOwn && authorId ? (
            <div className="mg-album-identity__follow flex items-center gap-1">
              {blockedByMe ? null : (
                <AuthorFollowButton authorId={authorId} onStatusChange={onFollowChange} />
              )}
              <ModerationMenu
                targetType="user"
                targetId={authorId}
                authorId={authorId}
                authorName={profile?.displayName}
                initialBlocked={blockedByMe}
                onBlockChange={onBlockChange}
                className="text-[#6a6258]"
                iconClassName="h-5 w-5"
              />
            </div>
          ) : null}
        </div>
      </div>

      {isOwn ? (
        <div className="mg-album-identity__actions">
          <Link href="/profile/edit" className="mg-album-action">
            <Pencil className="mg-album-action__icon" aria-hidden />
            プロフィールを編集
          </Link>
          <button
            type="button"
            className="mg-album-action mg-album-action--share"
            onClick={() => setShareOpen(true)}
          >
            <Share className="mg-album-action__icon" aria-hidden />
            プロフィールをシェア
          </button>
        </div>
      ) : null}

      <MyAlbumProfileShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        path={sharePath}
        handle={handle}
        displayName={name}
      />
    </header>
  );
}

export function MyAlbumProfileSkeleton() {
  return (
    <header className={cn("mg-album-profile", "is-loading")} aria-hidden>
      <div className="mg-album-cover mg-album-cover--skeleton">
        <div className="mg-album-identity">
          <div className="mg-album-avatar mg-album-avatar--skeleton" />
          <div className="mg-album-stats mg-album-stats--skel">
            <span className="mg-album-skel" />
            <span className="mg-album-skel" />
            <span className="mg-album-skel" />
          </div>
        </div>
      </div>
    </header>
  );
}
