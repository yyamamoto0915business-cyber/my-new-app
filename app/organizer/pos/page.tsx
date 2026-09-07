import { Suspense } from "react";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPosPage } from "@/components/organizer/pos/OrganizerPosPage";

export default function OrganizerPosRoutePage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="org-pos-shell mx-auto w-full max-w-7xl pb-16 min-[900px]:pb-2"
      >
        <Suspense
          fallback={
            <div className="org-pos">
              <div className="org-pos__loading">レジを準備しています…</div>
            </div>
          }
        >
          <OrganizerPosPage />
        </Suspense>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
