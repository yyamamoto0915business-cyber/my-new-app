import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerListingsHub } from "@/components/organizer/listings/OrganizerListingsHub";

export default function OrganizerListingsPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
      >
        <OrganizerListingsHub />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
