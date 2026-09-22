import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerGamePrintSheet } from "@/components/organizer/games/OrganizerGamePrintSheet";

export default function OrganizerGamePrintPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-3xl pb-16 min-[900px]:pb-2"
      >
        <OrganizerGamePrintSheet />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
