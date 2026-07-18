import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organizer } from "@/lib/db/types";
import type { ProfileRole } from "@/lib/db/types";
import { resolveEffectivePlan } from "@/lib/admin-organizer-plan";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  OrganizersTable,
  type OrganizerRow,
} from "@/app/admin/organizers/OrganizersTable";

const PAGE_SIZE = 20;

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: ProfileRole | null;
  created_at: string;
  avatar_url?: string | null;
};

function roleLabel(role: ProfileRole | null | undefined): string {
  if (role === "developer_admin") return "管理者";
  if (role === "organizer") return "主催者";
  if (role === "user") return "参加者";
  return role ?? "—";
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    role?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "organizers" ? "organizers" : "users";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());

  if (!supabase) {
    return (
      <AdminPageHeader
        title="アカウント管理"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const tabs = [
    { id: "users", label: "ユーザー一覧", href: "/admin/accounts?tab=users" },
    {
      id: "organizers",
      label: "主催者一覧",
      href: "/admin/accounts?tab=organizers",
    },
  ];

  if (tab === "organizers") {
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

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      );

    const rows: OrganizerRow[] = ((data ?? []) as unknown[])
      .map((row) => {
        const organizer = row as Organizer & {
          events?: { id: string }[];
          manual_grant_reason?: string | null;
        };
        if (!organizer.id || !isUuid(organizer.id)) return null;
        const info = resolveEffectivePlan(organizer);
        const mapped: OrganizerRow = {
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
        return mapped;
      })
      .filter((r): r is OrganizerRow => r != null);

    const paid = rows.filter((r) => r.currentPlan !== "free").length;
    const now = Date.now();
    const manualActive = rows.filter((r) => {
      if (!r.manualGrantActive) return false;
      if (!r.manualGrantExpiresAt) return true;
      return new Date(r.manualGrantExpiresAt).getTime() > now;
    }).length;

    return (
      <div>
        <AdminPageHeader
          title="アカウント管理"
          description="ユーザーと主催者のアカウントを一元管理できます。"
        />
        <AdminTabs tabs={tabs} activeId="organizers" />
        <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AdminStatCard label="主催者数" value={rows.length} />
          <AdminStatCard label="有料プラン" value={paid} tone="success" />
          <AdminStatCard
            label="無料プラン"
            value={rows.length - paid}
            tone="info"
          />
          <AdminStatCard
            label="手動付与中"
            value={manualActive}
            tone="warning"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700">{error.message}</p>
        ) : (
          <OrganizersTable organizers={rows} compact />
        )}
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let listQuery = supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at, avatar_url", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (sp.role && sp.role !== "all") {
    listQuery = listQuery.eq("role", sp.role);
  }
  if (q) {
    const escaped = q.replace(/[%_,]/g, "");
    listQuery = listQuery.or(
      `email.ilike.%${escaped}%,display_name.ilike.%${escaped}%`
    );
  }

  const [
    { data: profileRows, count: filteredCount, error: profileError },
    { data: organizerRows },
    { count: totalCount },
    { count: organizerRoleCount },
  ] = await Promise.all([
    listQuery,
    supabase.from("organizers").select("profile_id, organization_name"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "organizer"),
  ]);

  const orgNameByProfileId = new Map(
    (organizerRows ?? []).map((o) => [
      (o as { profile_id: string }).profile_id,
      (o as { organization_name: string | null }).organization_name,
    ])
  );

  const profiles = (profileRows ?? []) as ProfileRow[];
  const total = filteredCount ?? profiles.length;
  const suspended = 0;

  return (
    <div>
      <AdminPageHeader
        title="アカウント管理"
        description="ユーザーと主催者のアカウントを一元管理できます。"
      />
      <AdminTabs tabs={tabs} activeId="users" />

      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <AdminStatCard label="総アカウント数" value={totalCount ?? 0} />
        <AdminStatCard label="本人確認済み" value="—" helper="準備中" />
        <AdminStatCard
          label="主催者登録"
          value={organizerRoleCount ?? 0}
          tone="info"
        />
        <AdminStatCard label="このページ" value={profiles.length} />
        <AdminStatCard
          label="停止中"
          value={suspended}
          tone="danger"
          helper="準備中"
        />
      </div>

      <AdminFilterBar action="/admin/accounts">
        <input type="hidden" name="tab" value="users" />
        <AdminSearchInput
          defaultValue={q}
          placeholder="名前またはメールで検索"
        />
        <select
          name="role"
          defaultValue={sp.role ?? "all"}
          className="h-8 rounded-md border border-[#c8dcd0] bg-white px-2 text-xs"
        >
          <option value="all">すべて</option>
          <option value="user">参加者</option>
          <option value="organizer">主催者</option>
          <option value="developer_admin">管理者</option>
        </select>
      </AdminFilterBar>

      {profileError ? (
        <p className="text-sm text-red-700">{profileError.message}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#d8e8dc] bg-white shadow-sm">
            <table className="min-w-full text-xs">
              <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[10px] uppercase text-[#7a9888]">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">ユーザー</th>
                  <th className="px-3 py-1.5 text-left font-medium">ロール</th>
                  <th className="px-3 py-1.5 text-left font-medium">主催者</th>
                  <th className="px-3 py-1.5 text-left font-medium">登録日</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#eef4f0] last:border-0"
                  >
                    <td className="px-3 py-1.5">
                      <div className="font-medium text-[#0e1610]">
                        {p.display_name?.trim() || "（未設定）"}
                      </div>
                      <div className="truncate text-[11px] text-[#7a9888]">
                        {p.email ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <AdminStatusBadge
                        tone={
                          p.role === "developer_admin"
                            ? "success"
                            : p.role === "organizer"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {roleLabel(p.role)}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-3 py-1.5 text-[#5a7868]">
                      {orgNameByProfileId.get(p.id) ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-[#7a9888]">
                      {new Date(p.created_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profiles.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#7a9888]">
                該当するユーザーがいません
              </p>
            ) : null}
          </div>

          <AdminPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/admin/accounts"
            query={{
              tab: "users",
              q: q || undefined,
              role: sp.role && sp.role !== "all" ? sp.role : undefined,
            }}
          />
        </>
      )}

      <p className="mt-1.5 text-[11px] text-[#7a9888]">
        プラン操作は{" "}
        <Link href="/admin/accounts?tab=organizers" className="underline">
          主催者一覧
        </Link>
        から。警告・停止は準備中です。
      </p>
    </div>
  );
}
