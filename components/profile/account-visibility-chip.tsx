"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

export function AccountVisibilityChip({ className }: { className?: string }) {
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    fetch("/api/me/privacy")
      .then((res) => (res.ok ? res.json() : { isPrivate: false }))
      .then((data: { isPrivate?: boolean }) => {
        setIsPrivate(Boolean(data.isPrivate));
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/profile/privacy"
      className={`inline-flex items-center gap-1 rounded-full border border-[#d4d2cc] bg-white/90 py-0.5 pl-2 pr-1 text-[11px] font-semibold text-[#5c5a56] ${className ?? ""}`}
    >
      {isPrivate ? "非公開" : "公開中"}
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full border border-[#d4d2cc] bg-white"
        aria-hidden
      >
        <RotateCw className="h-2.5 w-2.5" strokeWidth={2.4} />
      </span>
    </Link>
  );
}
