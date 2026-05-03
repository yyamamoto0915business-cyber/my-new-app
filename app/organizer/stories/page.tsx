"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/lib/story-types";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { WaHeroBanner } from "@/components/wa-hero-banner";

const MOCK_ORGANIZER_ID = "org-1";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrganizerStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stories?authorId=${encodeURIComponent(MOCK_ORGANIZER_ID)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStories(Array.isArray(data) ? data : []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <OrganizerRegistrationGate>
      <div className="min-h-screen bg-[#f4f0e8]">
        <div className="space-y-4">
          <WaHeroBanner
            compact
            eyebrow="STORIES"
            title="ストーリー"
            subtitle="— まちの物語を伝える —"
            className="rounded-sm"
          />

          {/* CTAライト帯 */}
          <div className="flex items-center justify-between rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-3">
            <Link
              href="/organizer"
              className="text-[12px] text-[#6a6258] hover:text-[#3a3428] hover:underline"
            >
              ← ダッシュボードへ
            </Link>
            <Link
              href="/organizer/stories/new"
              className="inline-flex min-h-[34px] items-center rounded-full bg-[#1e3848] px-4 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
            >
              + ストーリーを書く
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl border border-[#ccc4b4] bg-[#e4ede0]" />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-10 text-center">
              <p className="text-[13px] text-[#6a6258]">まだストーリーがありません</p>
              <Link
                href="/organizer/stories/new"
                className="mt-4 inline-flex min-h-[40px] items-center rounded-full bg-[#1e3848] px-5 text-[13px] font-medium text-[#f4f0e8] hover:opacity-90"
              >
                最初のストーリーを書く
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {stories.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-4"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e4ede0]">
                    <Image src={s.coverImageUrl} alt="" fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      className="text-[14px] font-bold text-[#0e1610] line-clamp-1"
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                    >
                      {s.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-[11px] text-[#6a6258]">
                      {formatDate(s.updatedAt)}
                      {s.status === "draft" ? (
                        <span className="rounded-full border border-[#d8d0b8] bg-[#f0ede4] px-2 py-0.5 text-[10px] font-medium text-[#5a5040]">
                          下書き
                        </span>
                      ) : (
                        <span className="rounded-full border border-[#a8ccbc] bg-[#d8ece4] px-2 py-0.5 text-[10px] font-medium text-[#1a3428]">
                          公開中
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {s.status === "published" && (
                      <Link
                        href={`/stories/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[32px] items-center rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] font-medium text-[#3a3428] hover:bg-[#f0ece4]"
                      >
                        表示
                      </Link>
                    )}
                    <Link
                      href={`/organizer/stories/new?edit=${s.id}`}
                      className="inline-flex min-h-[32px] items-center rounded-full bg-[#1e3848] px-3 text-[12px] font-medium text-[#f4f0e8] hover:opacity-90"
                    >
                      編集
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="pb-6">
            <Link href="/stories" className="text-[13px] text-[#2c7a88] hover:underline">
              ストーリー一覧を見る →
            </Link>
          </div>
        </div>
      </div>
    </OrganizerRegistrationGate>
  );
}
