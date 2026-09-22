import { Suspense } from "react";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerGameCreateForm } from "@/components/organizer/games/OrganizerGameCreateForm";

export default function OrganizerGameCreatePage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-6xl pb-16 min-[900px]:pb-2"
      >
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#d5e2d8] bg-white px-4 py-10 text-center text-[13px] text-[#566358]">
              作成画面を準備しています…
            </div>
          }
        >
          <OrganizerGameCreateForm />
        </Suspense>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
