"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EventApplyConfirmSheet,
  type EventApplyConfirmInfo,
} from "@/components/events/detail/EventApplyConfirmSheet";

type Props = {
  event: EventApplyConfirmInfo;
};

/**
 * 本番のイベント詳細上で申込確認シートの見た目を確認する。
 * `/events/[id]?previewApplyConfirm=1` で表示（申込は行わない）。
 */
export function EventApplyConfirmPreviewOverlay({ event }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const preview = searchParams.get("previewApplyConfirm") === "1";
  const [open, setOpen] = useState(preview);

  useEffect(() => {
    setOpen(preview);
  }, [preview]);

  const clearPreview = useCallback(() => {
    setOpen(false);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("previewApplyConfirm");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!preview && !open) return null;

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-3 z-[80] -translate-x-1/2 rounded-full border border-[#cfe0c8] bg-[#eef6f0]/95 px-3 py-1.5 text-[12px] font-medium text-[#2d5a32] shadow-sm backdrop-blur-sm">
        申込確認のプレビュー（実際には申し込みません）
      </div>
      <EventApplyConfirmSheet
        open={open}
        event={event}
        onCancel={clearPreview}
        onConfirm={clearPreview}
      />
    </>
  );
}
