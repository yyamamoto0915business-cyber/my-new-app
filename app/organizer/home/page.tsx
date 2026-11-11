import type { Metadata } from "next";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerHomeClient } from "@/components/organizer/mobile/OrganizerHomeClient";

export const metadata: Metadata = {
  title: "主催者ホーム | MachiGlyph",
};

export default function OrganizerHomePage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerHomeClient />
    </OrganizerRegistrationGate>
  );
}
