import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerGamesHub } from "@/components/organizer/games/OrganizerGamesHub";

export default function OrganizerGamesPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-6xl pb-16 min-[900px]:pb-2"
      >
        <OrganizerGamesHub />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
