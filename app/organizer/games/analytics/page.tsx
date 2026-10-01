import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerGameAnalyticsEntry } from "@/components/organizer/games/OrganizerGameAnalyticsEntry";

export default function OrganizerGamesAnalyticsIndexPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-7xl pb-16 min-[900px]:pb-2"
      >
        <OrganizerGameAnalyticsEntry />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
