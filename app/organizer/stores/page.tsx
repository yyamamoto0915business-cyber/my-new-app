import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerStoresEntry } from "@/components/organizer/stores/OrganizerStoresEntry";

export default function OrganizerStoresIndexPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
      >
        <OrganizerStoresEntry kind="store" />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
