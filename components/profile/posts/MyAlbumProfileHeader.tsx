"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { cn } from "@/lib/utils";

const COVER_BG = "/profile/album/desk-scene.jpg";
const COVER_BOOK = "/profile/album/book-stage.png";
const TITLE_SPRIG = "/profile/album/title-sprig.png";

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
  heading,
  lead,
  isOwn,
  authorId,
  onSelectPosts,
}: {
  profile: AlbumProfile | null;
  heading: string;
  lead: string;
  isOwn: boolean;
  authorId?: string;
  onSelectPosts?: () => void;
}) {
  const name = profile?.displayName ?? (isOwn ? "あなた" : "ユーザー");

  return (
    <header className="mg-album-profile">
      <div className="mg-album-cover">
        <Image
          src={COVER_BG}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 720px) 100vw, 720px"
        />
        <Image
          src={COVER_BOOK}
          alt=""
          width={420}
          height={250}
          className="mg-album-cover__book"
          aria-hidden
          priority
        />
        <span className="mg-album-cover__wash" aria-hidden />
        <div className="mg-album-cover__copy">
          <h1 className="mg-album-cover__title">
            {heading}
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={28}
              height={44}
              className="mg-album-cover__sprig"
              aria-hidden
            />
          </h1>
          <p className="mg-album-cover__lead">{lead}</p>
        </div>
        {isOwn ? (
          <Link href="/profile/edit" className="mg-album-cover__edit">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            カバーを編集
          </Link>
        ) : null}
      </div>

      <div className="mg-album-identity">
        <div className="mg-album-identity__row">
          {isOwn ? (
            <Link
              href="/profile/edit"
              className="mg-album-avatar"
              aria-label="プロフィール写真を編集"
            >
              <ProfileBannerAvatar avatarUrl={profile?.avatarUrl ?? null} displayName={name} />
              <span className="mg-album-avatar__cam" aria-hidden>
                <Camera className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <div className="mg-album-avatar">
              <ProfileBannerAvatar avatarUrl={profile?.avatarUrl ?? null} displayName={name} />
            </div>
          )}

          <div className="mg-album-identity__text">
            <div className="mg-album-identity__name-row">
              <p className="mg-album-identity__name">{name}</p>
              {profile?.isPro ? <span className="mg-album-pro">PRO</span> : null}
            </div>
            {profile?.handle ? (
              <p className="mg-album-identity__handle">@{profile.handle}</p>
            ) : null}
            {profile?.bio ? (
              <p className="mg-album-identity__bio">{profile.bio}</p>
            ) : isOwn ? (
              <p className="mg-album-identity__bio mg-album-identity__bio--empty">
                まちの魅力を、未来のしるしに。
              </p>
            ) : null}
            {profile?.region ? (
              <p className="mg-album-identity__region">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {profile.region}
              </p>
            ) : null}
            {!isOwn && authorId ? (
              <div className="mg-album-identity__follow">
                <AuthorFollowButton authorId={authorId} />
              </div>
            ) : null}
          </div>
        </div>

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
      </div>
    </header>
  );
}

export function MyAlbumProfileSkeleton() {
  return (
    <header className={cn("mg-album-profile", "is-loading")} aria-hidden>
      <div className="mg-album-cover mg-album-cover--skeleton" />
      <div className="mg-album-identity">
        <div className="mg-album-identity__row">
          <div className="mg-album-avatar mg-album-avatar--skeleton" />
          <div className="mg-album-identity__text">
            <div className="mg-album-skel mg-album-skel--name" />
            <div className="mg-album-skel mg-album-skel--line" />
          </div>
        </div>
      </div>
    </header>
  );
}
