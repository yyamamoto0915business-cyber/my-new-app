import { redirect } from "next/navigation";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerStoresEntry } from "@/components/organizer/stores/OrganizerStoresEntry";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";

export default async function OrganizerKitchenCarsIndexPage() {
  const { organizerRegistered } = await getOrganizerNavState();
  if (!organizerRegistered) {
    redirect(
      `/organizer?next=${encodeURIComponent("/organizer/kitchen-cars")}`,
    );
  }

  return (
    <OrganizerPageShell
      variant="workspace"
      contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
    >
      <OrganizerStoresEntry kind="kitchen_car" />
    </OrganizerPageShell>
  );
}
