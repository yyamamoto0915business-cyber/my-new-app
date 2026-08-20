"use client";

import Image from "next/image";

const HERO_BG_DESKTOP = "/profile/album/hero-desktop-v5.png";
const HERO_BG_MOBILE = "/profile/album/hero-mobile-v5.png";
const TITLE_SPRIG = "/profile/album/title-sprig.png";

export function MyPostsHero() {
  return (
    <section className="my-album-hero" aria-label="マイアルバム">
      <div className="my-album-hero__bg" aria-hidden>
        <Image
          src={HERO_BG_MOBILE}
          alt=""
          fill
          priority
          className="object-cover object-center md:hidden"
          sizes="100vw"
        />
        <Image
          src={HERO_BG_DESKTOP}
          alt=""
          fill
          priority
          className="hidden object-cover object-right md:block"
          sizes="100vw"
        />
        <span className="my-album-hero__wash" />
      </div>

      <div className="my-album-hero__body my-album-mobile-only">
        <div className="my-album-hero__paper">
          <p className="my-album-hero__eyebrow">
            <span>MY ALBUM</span>
          </p>
          <h1 className="my-album-hero__title">
            マイアルバム
            <Image
              src={TITLE_SPRIG}
              alt=""
              width={44}
              height={70}
              className="my-album-hero__sprig"
              aria-hidden
            />
          </h1>
          <p className="my-album-hero__lead">
            残したしるしを、アルバムのように。
          </p>
        </div>
      </div>
    </section>
  );
}
