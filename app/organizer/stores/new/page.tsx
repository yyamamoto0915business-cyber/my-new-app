import type { Metadata } from "next";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerStoreCreateForm } from "@/components/organizer/stores/OrganizerStoreCreateForm";

export const metadata: Metadata = {
  title: "店舗を作成 | 店舗管理",
};

export default function OrganizerStoreNewPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell
        variant="workspace"
        contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
      >
        <OrganizerStoreCreateForm />
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
