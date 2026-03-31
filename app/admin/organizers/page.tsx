import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organizer } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";
import { OrganizersTable, type OrganizerRow } from "./OrganizersTable";

export default async function AdminOrganizersPage() {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
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

  const { data, error } = await supabase
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

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">主催者一覧</h2>
          <p className="mt-1 text-sm text-slate-500">
            主催者情報の取得に失敗しました。
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <div className="font-semibold">取得エラー</div>
          <div className="mt-1 text-xs text-red-800">
            {error.message ?? "Unknown error"}
          </div>
          {!adminSupabase && (
            <div className="mt-2 text-xs text-red-800">
              管理画面では通常、Service Role（`SUPABASE_SERVICE_ROLE_KEY`）が必要です。
              設定されていない場合、RLS により一覧が取得できないことがあります。
            </div>
          )}
        </div>
      </div>
    );
  }

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  const rows: OrganizerRow[] =
    (data ?? [])
      .map((row: any) => {
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
      })
      .filter((r) => typeof r.id === "string" && isUuid(r.id)) ?? [];

  return <OrganizersTable organizers={rows} />;
}

