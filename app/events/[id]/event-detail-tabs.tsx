"use client";

import { useState } from "react";
import Link from "next/link";
import type { Story } from "@/lib/story-types";
import type { Event } from "@/lib/db/types";
import { StoryCard } from "@/components/story/story-card";
import { EventQnASection } from "@/components/event-qna-section";
import { EventDetailHero } from "@/components/events/EventDetailHero";
import { MobileEventHeader } from "@/components/events/detail/MobileEventHeader";
import { EventSectionTabs } from "@/components/events/detail/EventSectionTabs";
import { EventInfoCard } from "@/components/events/detail/EventInfoCard";
import { MOBILE_EVENT_STICKY_SHELL } from "@/components/events/detail/detail-classes";
import { cn } from "@/lib/utils";

const TABS = ["概要", "主催者ストーリー", "みんなのレポ", "Q&A"] as const;

type Props = {
  eventId: string;
  eventTitle: string;
  shareUrl: string;
  event: Event;
  organizerStory: Story | null;
  repos: Story[];
  /** `EventPrimaryActions` を1か所だけ渡す（内部でモバイル／デスクトップを切替） */
  primaryActionsSlot: React.ReactNode;
  overviewChildren: React.ReactNode;
};

export function EventDetailTabs({
  eventId,
  eventTitle,
  shareUrl,
  event,
  organizerStory,
  repos,
  primaryActionsSlot,
  overviewChildren,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("概要");

  return (
    <>
      <div className={cn(MOBILE_EVENT_STICKY_SHELL, "isolate")}>
        <div className="sm:hidden">
          <MobileEventHeader eventId={eventId} title={eventTitle} shareUrl={shareUrl} />
        </div>
        <EventSectionTabs
          tabs={TABS}
          value={tab}
          onChange={(t) => setTab(t as (typeof TABS)[number])}
        />
      </div>

      {/* モバイル: 情報カード →（デスクトップ: 概要時のみヒーロー）→ 主アクション */}
      <div className="sm:hidden space-y-4">
        <EventInfoCard event={event} />
      </div>

      {tab === "概要" && (
        <div className="mt-6 hidden sm:block">
          <EventDetailHero event={event} />
        </div>
      )}

      <div className="mt-4 sm:mt-6">{primaryActionsSlot}</div>

      <div className="py-6 sm:py-8">
        {tab === "概要" && overviewChildren}

        {tab === "主催者ストーリー" && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
            {organizerStory ? (
              <div>
                <StoryCard story={organizerStory} />
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  主催者ストーリーはまだありません
                </p>
                <Link
                  href="/organizer/stories/new"
                  className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  主催者はストーリーを書く
                </Link>
              </div>
            )}
          </section>
        )}

        {tab === "みんなのレポ" && (
          <section className="space-y-4">
            {repos.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  まだレポがありません
                </p>
                <Link
                  href={`/report/new?eventId=${eventId}`}
                  className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  レポを書く
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {repos.map((s) => (
                    <StoryCard key={s.id} story={s} />
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href="/stories"
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    もっと見る →
                  </Link>
                </div>
              </>
            )}
          </section>
        )}

        {tab === "Q&A" && (
          <section>
            <EventQnASection eventId={eventId} />
          </section>
        )}
      </div>
    </>
  );
}
