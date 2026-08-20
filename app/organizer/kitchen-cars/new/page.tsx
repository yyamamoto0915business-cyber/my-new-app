import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerStoreCreateForm } from "@/components/organizer/stores/OrganizerStoreCreateForm";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";

export const metadata: Metadata = {
  title: "キッチンカーを作成 | キッチンカー管理",
};

export default async function OrganizerKitchenCarNewPage() {
  const { organizerRegistered } = await getOrganizerNavState();
  if (!organizerRegistered) {
    redirect(
      `/organizer?next=${encodeURIComponent("/organizer/kitchen-cars/new")}`,
    );
  }

  return (
    <OrganizerPageShell
      variant="workspace"
      contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
    >
      <OrganizerStoreCreateForm kind="kitchen_car" />
    </OrganizerPageShell>
  );
}
