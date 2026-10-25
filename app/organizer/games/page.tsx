import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanFeatureGate } from "@/components/organizer/OrganizerPlanFeatureGate";
import { OrganizerGamesHub } from "@/components/organizer/games/OrganizerGamesHub";

export default function OrganizerGamesPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-7xl pb-2"
      >
        <OrganizerPlanFeatureGate feature="games">
          <OrganizerGamesHub />
        </OrganizerPlanFeatureGate>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
