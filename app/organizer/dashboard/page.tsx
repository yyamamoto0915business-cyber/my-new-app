import type { Metadata } from "next";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerAnalyticsPage } from "@/components/organizer/dashboard/OrganizerAnalyticsPage";

export const metadata: Metadata = {
  title: "くわしい数字 | MachiGlyph",
};

export default function OrganizerDashboardPage() {
  return (
    <OrganizerRegistrationGate>
      <OrganizerAnalyticsPage />
    </OrganizerRegistrationGate>
  );
}
