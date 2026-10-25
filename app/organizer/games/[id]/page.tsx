import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanFeatureGate } from "@/components/organizer/OrganizerPlanFeatureGate";
import { OrganizerGameEditor } from "@/components/organizer/games/OrganizerGameEditor";

export default function OrganizerGameDetailPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-3xl pb-16 min-[1100px]:max-w-5xl min-[900px]:pb-2"
      >
        <OrganizerPlanFeatureGate feature="games">
          <OrganizerGameEditor />
        </OrganizerPlanFeatureGate>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
