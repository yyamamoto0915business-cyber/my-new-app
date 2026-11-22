"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * スマホでは中身をたたんでおき、「もっと見る」で開く。PC（768px〜）ではいつも開いたまま。
 * 管理者ダッシュボードの下の方（最近の動き・サービス状況など）でスクロールを減らすために使う。
 */
export function AdminMobileMore({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#e6e2d6] bg-white px-4 py-3 text-[13.5px] font-bold text-[#173f2c] min-[768px]:hidden"
      >
        {open ? "閉じる" : label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div className={open ? "space-y-3" : "space-y-3 max-[767px]:hidden"}>{children}</div>
    </>
  );
}
