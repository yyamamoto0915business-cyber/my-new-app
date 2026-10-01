import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerGameAnalytics } from "@/components/organizer/games/OrganizerGameAnalytics";

export default function OrganizerGameAnalyticsPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-7xl pb-16 min-[900px]:pb-2"
      >
        <OrganizerGameAnalytics />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
