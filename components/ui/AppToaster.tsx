"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { subscribeToasts, type ToastItem } from "@/lib/toast";
import { cn } from "@/lib/utils";

const SHOW_MS = 4500;

/** showToast() で出す通知の表示。画面の下（スマホは下のナビの上）に重ねて出し、少したつと消える */
export function AppToaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((cur) => [...cur.slice(-2), t]);
        window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), SHOW_MS);
      }),
    []
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-[2000] flex flex-col items-center gap-2 px-4 pc:bottom-6"
      aria-live="polite"
    >
      {items.map((t) => {
        const Icon = t.type === "success" ? CheckCircle2 : t.type === "info" ? Info : XCircle;
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-[16px] border px-3.5 py-3 text-[14px] font-bold leading-snug shadow-[0_8px_24px_rgba(22,56,40,0.16)]",
              t.type === "error" && "border-[#f0d4d0] bg-[#fdf3f1] text-[#8a2f25]",
              t.type === "success" && "border-[#cfe3d6] bg-[#eef7f1] text-[#1f6a42]",
              t.type === "info" && "border-[#d8e3ee] bg-[#f1f6fb] text-[#2a4a6b]"
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="m-0 min-w-0 flex-1 whitespace-pre-line">{t.message}</p>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setItems((cur) => cur.filter((x) => x.id !== t.id))}
              className="-my-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
