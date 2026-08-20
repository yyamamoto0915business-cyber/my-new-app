"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

/** 看板素材（1024×438）— 木枠・ポラロイド・下棚が焼き込み済み */
const SIGNBOARD_IMAGE = "/posts/hero-board-polaroids-wide.png";
/** 付箋素材（羊皮紙＋ピン＋文言入り・背景透過） */
const STICKY_NOTE_IMAGE = "/posts/hero-sticky-note-cut.png";

/** モバイルでは紙の外（掲示板の下）に置くため、文言を共有する */
export const POSTS_HERO_DESC_LINES = [
  "まちの魅力は、主催者だけでは伝えきれない。",
  "地域のみんなの投稿が、そのまちの魅力をつくる。",
] as const;

type Props = {
  compact?: boolean;
};

/**
 * みんなの投稿ヒーロー（掲示板看板）
 * 素材の木枠を CSS で切らず、オーバーレイも載せずそのまま表示する
 */
export function PostsHero({ compact }: Props) {
  return (
    <section
      className={
        compact
          ? "posts-hero posts-hero--signboard posts-hero--compact"
          : "posts-hero posts-hero--signboard"
      }
      aria-label="みんなの投稿"
    >
      <div className="posts-hero__media">
        <Image
          src={SIGNBOARD_IMAGE}
          alt=""
          fill
          priority
          className="object-contain object-center"
          sizes={compact ? "100vw" : "(min-width: 900px) 1280px, 100vw"}
        />
      </div>

      <div className="posts-hero__center">
        <div className="posts-hero-paper">
          <span className="posts-hero-paper__curl" aria-hidden />
          <span className="posts-hero-paper__pin posts-hero-paper__pin--l" aria-hidden />
          <span className="posts-hero-paper__pin posts-hero-paper__pin--r" aria-hidden />
          <p className="posts-hero-paper__eyebrow">
            みんなで見つけて、育てていくまちの魅力
          </p>
          <h1 className="posts-hero-paper__title">
            みんなの投稿
            <span className="posts-hero-paper__underline" aria-hidden />
          </h1>
          {!compact ? (
            <p className="posts-hero-paper__desc">
              {POSTS_HERO_DESC_LINES[0]}
              <br />
              {POSTS_HERO_DESC_LINES[1]}
            </p>
          ) : null}
          <Link href="/posts/new" className="posts-hero-cta">
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            まちの魅力を投稿する
          </Link>
        </div>
      </div>

      {!compact ? (
        <aside
          className="posts-hero-board-note"
          aria-label="あなたのいいながまちの魅力を広げる力に"
          style={{ top: "76%", left: "80%" }}
        >
          <Image
            src={STICKY_NOTE_IMAGE}
            alt=""
            width={965}
            height={977}
            className="posts-hero-board-note__img"
            priority
          />
        </aside>
      ) : null}
    </section>
  );
}
