"use client";

import Image from "next/image";
import Link from "next/link";

const VOLUNTEER_IMAGE = "/home/pc/cta-volunteer.png";
const ORGANIZER_IMAGE = "/home/pc/cta-organizer.png";

export function MobileCtaBanners() {
  return (
    <section aria-label="次のアクション" className="grid grid-cols-2 gap-2">
      <div className="relative min-h-[112px] overflow-hidden rounded-[14px] ring-1 ring-[#d8eadc]">
        <Image
          src={VOLUNTEER_IMAGE}
          alt=""
          fill
          className="object-cover object-right"
          sizes="50vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef6f0]/97 via-[#eef6f0]/65 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[112px] flex-col justify-center p-2.5 pr-[40%]">
          <h3
            className="text-[11px] font-semibold leading-snug text-[#1a3e28]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            地域で手伝いたい方へ
          </h3>
          <p className="mt-0.5 text-[8px] leading-snug text-[#3d5c48]">
            募集中のボランティア活動を探せます
          </p>
          <Link
            href="/volunteer"
            className="mt-1.5 inline-flex w-fit items-center rounded-full bg-[#3d7858] px-2.5 py-1 text-[9px] font-semibold text-white"
          >
            ボランティアを探す →
          </Link>
        </div>
      </div>

      <div className="relative min-h-[112px] overflow-hidden rounded-[14px] ring-1 ring-[#f0e8c8]">
        <Image
          src={ORGANIZER_IMAGE}
          alt=""
          fill
          className="object-cover object-right"
          sizes="50vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#fef8e8]/97 via-[#fef8e8]/65 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[112px] flex-col justify-center p-2.5 pr-[40%]">
          <h3
            className="text-[11px] font-semibold leading-snug text-[#3a2810]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            イベントを主催したい方へ
          </h3>
          <p className="mt-0.5 text-[8px] leading-snug text-[#5a4818]">
            掲載・募集・参加者管理ができます
          </p>
          <Link
            href="/organizer"
            className="mt-1.5 inline-flex w-fit items-center rounded-full bg-[#c8a030] px-2.5 py-1 text-[9px] font-semibold text-white"
          >
            主催者になる →
          </Link>
        </div>
      </div>
    </section>
  );
}
