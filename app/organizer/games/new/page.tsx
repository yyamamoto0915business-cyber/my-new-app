"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanFeatureGate } from "@/components/organizer/OrganizerPlanFeatureGate";
import { OrganizerGameCreateSwitch } from "@/components/organizer/games/OrganizerGameCreateSwitch";
import { isDevPreviewSuccessQuery } from "@/lib/dev-publish-success-preview";

function OrganizerGameCreatePageEntry() {
  const previewSuccess = isDevPreviewSuccessQuery(useSearchParams().get("previewSuccess"));
  const content = (
    <OrganizerPageShell
      variant="workspace"
      contentClassName="mx-auto w-full max-w-7xl pb-16 min-[900px]:pb-2"
    >
      <OrganizerPlanFeatureGate feature="games" mode="block">
        <OrganizerGameCreateSwitch />
      </OrganizerPlanFeatureGate>
    </OrganizerPageShell>
  );
  if (previewSuccess) return content;
  return <OrganizerRegistrationGate>{content}</OrganizerRegistrationGate>;
}

export default function OrganizerGameCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#d5e2d8] bg-white px-4 py-10 text-center text-[13px] text-[#566358]">
          作成画面を準備しています…
        </div>
      }
    >
      <OrganizerGameCreatePageEntry />
    </Suspense>
  );
}
