"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getOrganizerMode,
  setOrganizerMode,
} from "@/lib/organizer-mode";

/** 主催者モードON時、BottomNavの2番目を「主催」に差し替える */
export function OrganizerModeToggle() {
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOn(getOrganizerMode());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => setOn(getOrganizerMode());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [mounted]);

  const handleToggle = () => {
    const next = !on;
    setOn(next);
    setOrganizerMode(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("organizer-mode-change"));
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          主催者モード
        </p>
        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
          オンにすると、スマホ下部ナビに「主催」を表示
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={handleToggle}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
          on
            ? "border-[var(--accent)] bg-[var(--accent)]"
            : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
