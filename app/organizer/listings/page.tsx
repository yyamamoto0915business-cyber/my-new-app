import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerListingsHub } from "@/components/organizer/listings/OrganizerListingsHub";
import { OrganizerListingsMobile } from "@/components/organizer/mobile/OrganizerListingsMobile";

export default function OrganizerListingsPage() {
  return (
    <OrganizerRegistrationGate>
      {/* PC：種類を選ぶハブ */}
      <div className="hidden min-[900px]:block">
        <OrganizerPageShell
          variant="workspace"
          contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
        >
          <OrganizerListingsHub />
        </OrganizerPageShell>
      </div>
      {/* スマホ：種類をまたいだ1つの一覧（見本「02_掲載管理」） */}
      <div className="min-[900px]:hidden">
        <OrganizerListingsMobile />
      </div>
    </OrganizerRegistrationGate>
  );
}
