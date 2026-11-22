import { redirect } from "next/navigation";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerPlanFeatureGate } from "@/components/organizer/OrganizerPlanFeatureGate";
import { OrganizerGamesHub } from "@/components/organizer/games/OrganizerGamesHub";

/**
 * ゲームの一覧は「掲載管理」のゲームにまとめた（スマホ・PC 共通）。
 * ただし「新しく掲載 → ゲーム」から来たとき（?pick=1）は、ゲームの種類を選ぶ画面としてここを使う。
 */
export default async function OrganizerGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ pick?: string }>;
}) {
  const { pick } = await searchParams;
  if (pick !== "1") redirect("/organizer/listings?kind=game");
  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell variant="workspace" contentClassName="mx-auto w-full max-w-7xl pb-2">
        <OrganizerPlanFeatureGate feature="games">
          <OrganizerGamesHub pickOnly />
        </OrganizerPlanFeatureGate>
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}
