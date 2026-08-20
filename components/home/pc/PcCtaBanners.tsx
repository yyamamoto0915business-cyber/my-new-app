"use client";

import Image from "next/image";
import Link from "next/link";

const VOLUNTEER_IMAGE = "/home/pc/cta-volunteer.png";
const ORGANIZER_IMAGE = "/home/pc/cta-organizer.png";

export function PcCtaBanners() {
  return (
    <section aria-label="次のアクション" className="grid grid-cols-2 gap-3">
      {/* ボランティア */}
      <div className="relative min-h-[124px] overflow-hidden rounded-[14px] ring-1 ring-[#d8eadc]">
        <Image
          src={VOLUNTEER_IMAGE}
          alt=""
          fill
          className="object-cover object-right"
          sizes="(min-width: 900px) 640px, 50vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#eef6f0]/95 via-[#eef6f0]/55 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-[124px] flex-col justify-center p-4 pr-[44%]">
          <h3
            className="text-[14px] font-semibold leading-snug text-[#1a3e28]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            地域で手伝いたい方へ
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[#3d5c48]">
            ボランティア募集から、お手伝いできる活動を見つけられます。
          </p>
          <Link
            href="/?kind=volunteer"
            className="mt-2.5 inline-flex w-fit items-center rounded-full bg-[#3d7858] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#356a4e]"
          >
            ボランティアを見る →
          </Link>
        </div>
      </div>

      {/* 主催者 */}
      <div className="relative min-h-[124px] overflow-hidden rounded-[14px] ring-1 ring-[#f0e8c8]">
        <Image
          src={ORGANIZER_IMAGE}
          alt=""
          fill
          className="object-cover object-right"
          sizes="(min-width: 900px) 640px, 50vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#fef8e8]/95 via-[#fef8e8]/55 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-[124px] flex-col justify-center p-4 pr-[44%]">
          <h3
            className="text-[14px] font-semibold leading-snug text-[#3a2810]"
            style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            イベントを主催したい方へ
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[#5a4818]">
            地域の催しを掲載して、参加者やボランティアとつながれます。
          </p>
          <Link
            href="/organizer/listings"
            className="mt-2.5 inline-flex w-fit items-center rounded-full bg-[#c8a030] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#b89028]"
          >
            主催者になる →
          </Link>
        </div>
      </div>
    </section>
  );
}
