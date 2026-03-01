"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/db/types";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];
const IMAGE_HOSTS = ["images.unsplash.com", "placehold.co", "i.imgur.com"];

function isImageHostAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
const INTERVAL_MS = 5000;

type Props = {
  events: Event[];
};

export function HeroSlideshow({ events }: Props) {
  const [index, setIndex] = useState(0);

  const slides = events.filter((e) => e.imageUrl?.trim()).slice(0, 5);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const event = slides[index];

  return (
    <section className="relative mx-auto mb-8 overflow-hidden rounded-b-2xl">
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative aspect-[21/9] w-full overflow-hidden sm:aspect-[3/1]">
          {event.imageUrl ? (
            isImageHostAllowed(event.imageUrl) ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover transition-opacity duration-700"
                sizes="100vw"
              />
            ) : (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-zinc-300 dark:bg-zinc-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8">
            <p className="text-xs font-medium text-white/90 sm:text-sm">
              {event.prefecture ?? event.area ?? event.location}
            </p>
            <h2 className="mt-1 font-serif text-lg font-semibold text-white drop-shadow-md line-clamp-2 sm:text-xl md:text-2xl">
              {event.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/90 sm:text-sm">
              <span>
                {WEEKDAY[new Date(event.date + "T12:00:00").getDay()]} {event.date.replace(/-/g, "/")}
              </span>
              <span>{event.startTime}</span>
              <span className="font-medium text-white">
                {event.price === 0 ? "無料" : `¥${event.price}`}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`スライド ${i + 1} へ`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            aria-label="前へ"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            aria-label="次へ"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
