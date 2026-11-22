import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerListingsMobile } from "@/components/organizer/mobile/OrganizerListingsMobile";

export default function OrganizerListingsPage() {
  return (
    <OrganizerRegistrationGate>
      {/* スマホ・PC 共通：種類をまたいだ1つの一覧（見本「02_掲載管理」）。PC では中央にまとめる */}
      <div className="min-[900px]:mx-auto min-[900px]:w-full min-[900px]:max-w-[960px] min-[900px]:pt-3 min-[900px]:pb-10">
        <OrganizerListingsMobile />
      </div>
    </OrganizerRegistrationGate>
  );
}
