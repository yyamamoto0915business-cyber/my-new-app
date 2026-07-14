"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PassMobileTicket } from "@/components/pass/PassMobileTicket";
import type { ParticipationPass } from "@/lib/participation-pass";

type Props = {
  open: boolean;
  pass: ParticipationPass | null;
  onClose: () => void;
};

/** モバイル：パスを開いたときのフル画面チケット表示（bottom nav の上に出す） */
export function PassDetailDrawer({ open, pass, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open || !pass) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col min-[900px]:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="参加パス詳細"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2818]/45 backdrop-blur-[2px]"
        aria-label="詳細を閉じる"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex h-full w-full max-w-[400px] min-h-0 flex-col justify-center py-1">
          <PassMobileTicket pass={pass} onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body
  );
}
