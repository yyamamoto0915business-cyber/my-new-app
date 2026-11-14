import type { Metadata } from "next";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerTeamInvitePage } from "@/components/organizer/team/OrganizerTeamInvitePage";

export const metadata: Metadata = {
  title: "メンバーを招待 | MachiGlyph",
};

export default function Page() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerTeamInvitePage />
    </OrganizerRegistrationGate>
  );
}
