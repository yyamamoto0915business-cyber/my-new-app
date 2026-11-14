import type { Metadata } from "next";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerTeamPage } from "@/components/organizer/team/OrganizerTeamPage";

export const metadata: Metadata = {
  title: "チーム・招待 | MachiGlyph",
};

export default function Page() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerTeamPage />
    </OrganizerRegistrationGate>
  );
}
