"use client";

import { useState } from "react";
import Link from "next/link";
import type { Story } from "@/lib/story-types";
import { StoryCard } from "@/components/story/story-card";
import { EventQnASection } from "@/components/event-qna-section";

const TABS = ["概要", "主催者ストーリー", "みんなのレポ", "Q&A"] as const;

type Props = {
  eventId: string;
  organizerStory: Story | null;
  repos: Story[];
  overviewChildren: React.ReactNode;
  isAvailable: boolean;
};

export function EventDetailTabs({
  eventId,
  organizerStory,
  repos,
  overviewChildren,
  isAvailable,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("概要");

  return (
    <>
      <div className="sticky top-[57px] z-40 flex border-b border-zinc-200 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/95">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-6">
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
