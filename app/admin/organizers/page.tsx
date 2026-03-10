import { createClient } from "@/lib/supabase/server";
import type { Organizer } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";
import { OrganizersTable, type OrganizerRow } from "./OrganizersTable";

export default async function AdminOrganizersPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">主催者一覧</h2>
        <p className="text-sm text-slate-500">
          Supabase が未設定のため、主催者情報を表示できません。
        </p>
      </div>
    );
  }

  const { data } = await supabase
    .from("organizers")
    .select(
      `
      id,
      organization_name,
      contact_email,
      plan,
      manual_grant_active,
      manual_grant_plan,
      manual_grant_expires_at,
      manual_grant_reason,
      billing_source,
      subscription_status,
      current_period_end,
      updated_at,
      events:events ( id )
    `
    )
    .order("created_at", { ascending: true });

  const rows: OrganizerRow[] =
    (data ?? []).map((row: any) => {
      const organizer = row as unknown as Organizer & {
        manual_grant_plan?: string | null;
        manual_grant_reason?: string | null;
        billing_source?: string | null;
        events?: { id: string }[];
      };
      const info = resolveEffectivePlan(organizer);
      return {
        id: organizer.id,
        organizationName: organizer.organization_name,
        contactEmail: organizer.contact_email,
        currentPlan: info.currentPlan,
        billingSource: info.billingSource,
        manualGrantActive: info.manualGrantActive,
        manualGrantExpiresAt: info.manualGrantExpiresAt,
        manualGrantReason: organizer.manual_grant_reason ?? null,
        eventCount: organizer.events?.length ?? 0,
        updatedAt: organizer.updated_at ?? null,
      };
    }) ?? [];

  return <OrganizersTable organizers={rows} />;
}

