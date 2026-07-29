"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";

export function AdminRecruitmentVisibilityButton({
  recruitmentId,
  currentStatus,
  compact = false,
}: {
  recruitmentId: string;
  currentStatus: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublic = currentStatus === "public";
  const nextStatus = isPublic ? "draft" : "public";
  const label = isPublic ? "非公開" : "公開";
  const fullLabel = isPublic ? "非公開にする" : "公開する";

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recruitments/${recruitmentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "更新に失敗しました");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setPending(false);
    }
  }

  if (currentStatus === "closed") {
    return (
      <span className="text-[10px] text-[#7a9888]">終了</span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-md border border-[#c8dcd0] bg-white px-2 py-0.5 text-[11px] text-[#1e3848] hover:bg-[#eaf2ec]"
            : "rounded-lg border border-[#c8dcd0] bg-white px-2.5 py-1.5 text-xs text-[#1e3848] hover:bg-[#eaf2ec]"
        }
      >
        {compact ? label : fullLabel}
      </button>
      {error ? <p className="mt-0.5 text-[10px] text-red-600">{error}</p> : null}
      <AdminConfirmDialog
        open={open}
        title={fullLabel}
        description={
          nextStatus === "public"
            ? "この募集を公開状態にします。よろしいですか？"
            : "この募集を非公開（下書き）にします。よろしいですか？"
        }
        confirmLabel={fullLabel}
        danger={nextStatus === "draft"}
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
